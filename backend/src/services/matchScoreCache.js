// Read-through cache for matching engine results.
//
// On read: lookup (student, internship) in match_score_cache. If hit, return
// the row. If miss, fetch the inputs, run matchingEngine.score, INSERT, return.
//
// On mutation: callers invoke invalidateForStudent / invalidateForInternship /
// invalidateForEmployer to delete affected rows. The next read recomputes.

const pool = require('../config/db');
const { score } = require('./matchingEngine');
const { inFieldIndustries } = require('../config/majorFieldMap');

// ---------------------------------------------------------------------------
// Loaders — fetch the raw inputs the engine needs
// ---------------------------------------------------------------------------
async function loadStudent(studentUserId) {
  const [rows] = await pool.execute(
    `SELECT s.user_id, s.major, s.gpa, s.city, s.country
       FROM student s
      WHERE s.user_id = ?`,
    [String(studentUserId)]
  );
  if (rows.length === 0) return null;
  const student = rows[0];

  const [skills] = await pool.execute(
    `SELECT hs.skill_id, hs.proficiency_level
       FROM has_skill hs
      WHERE hs.student_user_id = ?`,
    [String(studentUserId)]
  );
  student.skills = skills;
  return student;
}

async function loadInternship(internshipId) {
  const [rows] = await pool.execute(
    `SELECT i.internship_id, i.city, i.country, i.work_type, i.minimum_gpa,
            i.deadline, e.industry
       FROM internship i
       JOIN employer e ON e.user_id = i.employer_user_id
      WHERE i.internship_id = ?`,
    [String(internshipId)]
  );
  if (rows.length === 0) return null;
  const internship = rows[0];

  const [skills] = await pool.execute(
    `SELECT rs.skill_id, rs.required_level, rs.is_mandatory, s.display_name
       FROM requires_skill rs
       JOIN skill s ON s.skill_id = rs.skill_id
      WHERE rs.internship_id = ?`,
    [String(internshipId)]
  );
  internship.mandatorySkills = skills.filter((s) => s.is_mandatory).map((s) => ({
    skill_id: s.skill_id,
    display_name: s.display_name,
    required_level: s.required_level,
  }));
  internship.optionalSkills = skills.filter((s) => !s.is_mandatory).map((s) => ({
    skill_id: s.skill_id,
    display_name: s.display_name,
    required_level: s.required_level,
  }));
  return internship;
}

// ---------------------------------------------------------------------------
// Compute + persist
// ---------------------------------------------------------------------------
async function computeAndStore(studentUserId, internshipId) {
  const [student, internship] = await Promise.all([
    loadStudent(studentUserId),
    loadInternship(internshipId),
  ]);
  if (!student || !internship) return null;

  const result = score({ student, internship });

  await pool.execute(
    `INSERT INTO match_score_cache (student_user_id, internship_id, final_score, breakdown)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE final_score = VALUES(final_score),
                               breakdown   = VALUES(breakdown),
                               computed_at = CURRENT_TIMESTAMP`,
    [String(studentUserId), String(internshipId), result.finalScore, JSON.stringify(result.breakdown)]
  );

  return result;
}

// ---------------------------------------------------------------------------
// Single-pair read (used by applyToInternship and per-internship detail)
// ---------------------------------------------------------------------------
async function getOrCompute(studentUserId, internshipId) {
  const [rows] = await pool.execute(
    `SELECT final_score, breakdown FROM match_score_cache
      WHERE student_user_id = ? AND internship_id = ?`,
    [String(studentUserId), String(internshipId)]
  );
  if (rows.length > 0) {
    return {
      finalScore: Number(rows[0].final_score),
      breakdown:  parseBreakdown(rows[0].breakdown),
      alerts:     parseBreakdown(rows[0].breakdown).alerts || [],
    };
  }
  return computeAndStore(studentUserId, internshipId);
}

function parseBreakdown(value) {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (err) { return {}; }
  }
  return value;
}

// ---------------------------------------------------------------------------
// Bulk read (used by recommendations and candidate ranking)
// ---------------------------------------------------------------------------
//
// Returns an array of { internship_id, finalScore, breakdown, alerts },
// computing missing rows on the fly.
//
async function getOrComputeBulk(studentUserId, internshipIds) {
  if (!internshipIds.length) return [];

  const placeholders = internshipIds.map(() => '?').join(',');
  const [cached] = await pool.execute(
    `SELECT internship_id, final_score, breakdown
       FROM match_score_cache
      WHERE student_user_id = ?
        AND internship_id IN (${placeholders})`,
    [String(studentUserId), ...internshipIds.map(String)]
  );

  const cachedMap = {};
  for (const row of cached) {
    const breakdown = parseBreakdown(row.breakdown);
    cachedMap[row.internship_id] = {
      internship_id: row.internship_id,
      finalScore: Number(row.final_score),
      breakdown,
      alerts: breakdown.alerts || [],
    };
  }

  const missing = internshipIds.filter((id) => !(id in cachedMap));
  for (const id of missing) {
    const result = await computeAndStore(studentUserId, id);
    if (result) {
      cachedMap[id] = {
        internship_id: id,
        finalScore: result.finalScore,
        breakdown: result.breakdown,
        alerts: result.alerts,
      };
    }
  }

  return internshipIds.map((id) => cachedMap[id]).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Field-filtered query: list active, non-expired, in-field internships for
// a given student (excluding ones they've already applied to). Used by the
// student recommendations endpoint.
// ---------------------------------------------------------------------------
async function listInFieldInternshipIds(studentUserId, studentMajor) {
  const fieldIndustries = inFieldIndustries(studentMajor);
  if (fieldIndustries.length === 0) return [];

  const placeholders = fieldIndustries.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT i.internship_id
       FROM internship i
       JOIN employer e ON e.user_id = i.employer_user_id
      WHERE e.industry IN (${placeholders})
        AND i.status = 'active'
        AND (i.deadline IS NULL OR i.deadline >= CURRENT_DATE)
        AND i.internship_id NOT IN (
          SELECT internship_id FROM application WHERE student_user_id = ?
        )`,
    [...fieldIndustries, String(studentUserId)]
  );
  return rows.map((r) => r.internship_id);
}

// ---------------------------------------------------------------------------
// Invalidation
// ---------------------------------------------------------------------------
async function invalidateForStudent(studentUserId) {
  await pool.execute(
    `DELETE FROM match_score_cache WHERE student_user_id = ?`,
    [String(studentUserId)]
  );
}

async function invalidateForInternship(internshipId) {
  await pool.execute(
    `DELETE FROM match_score_cache WHERE internship_id = ?`,
    [String(internshipId)]
  );
}

async function invalidateForEmployer(employerUserId) {
  await pool.execute(
    `DELETE FROM match_score_cache
      WHERE internship_id IN (
        SELECT internship_id FROM internship WHERE employer_user_id = ?
      )`,
    [String(employerUserId)]
  );
}

module.exports = {
  getOrCompute,
  getOrComputeBulk,
  computeAndStore,
  listInFieldInternshipIds,
  invalidateForStudent,
  invalidateForInternship,
  invalidateForEmployer,
  // exported for tests / direct internal use:
  loadStudent,
  loadInternship,
};
