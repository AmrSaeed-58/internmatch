const pool = require('../config/db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const embeddingService = require('../utils/embeddingService');

// Canonical public visibility filter (reusable SQL fragment)
const VISIBILITY_JOIN = `
  JOIN employer e ON i.employer_user_id = e.user_id
  JOIN users u_emp ON e.user_id = u_emp.user_id AND u_emp.is_active = TRUE
`;
const VISIBILITY_WHERE = `
  i.status = 'active'
  AND (i.deadline IS NULL OR i.deadline >= CURDATE())
`;

/**
 * GET /api/internships
 * List active internships with filters + pagination.
 * Optional auth: if student, include match_score per result.
 */
const listInternships = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    q,
    work_type,
    location,
    duration_min,
    duration_max,
    salary_min,
    paid_only,
    industry,
    skill,
    sort = 'newest',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = [VISIBILITY_WHERE];
  const params = [];

  // Traditional filters
  if (work_type && ['remote', 'hybrid', 'on-site'].includes(work_type)) {
    whereClauses.push('i.work_type = ?');
    params.push(work_type);
  }

  if (location) {
    whereClauses.push('i.location LIKE ?');
    params.push(`%${location}%`);
  }

  if (duration_min) {
    whereClauses.push('i.duration_months >= ?');
    params.push(parseInt(duration_min, 10));
  }

  if (duration_max) {
    whereClauses.push('i.duration_months <= ?');
    params.push(parseInt(duration_max, 10));
  }

  if (salary_min) {
    whereClauses.push('(i.salary_max IS NOT NULL AND i.salary_max >= ?)');
    params.push(parseFloat(salary_min));
  }

  if (paid_only === 'true') {
    whereClauses.push('(i.salary_min > 0 OR i.salary_max > 0)');
  }

  if (industry) {
    whereClauses.push('e.industry LIKE ?');
    params.push(`%${industry}%`);
  }

  if (skill) {
    whereClauses.push(`i.internship_id IN (
      SELECT rs.internship_id FROM requires_skill rs
      JOIN skill s ON rs.skill_id = s.skill_id
      WHERE s.display_name LIKE ?
    )`);
    params.push(`%${skill}%`);
  }

  const searchQuery = q && q.trim() ? q.trim() : null;
  const useSemanticSearch = !!searchQuery;

  // For short queries (< 3 words), also run SQL LIKE fallback
  const isShortQuery = searchQuery && searchQuery.split(/\s+/).length < 3;

  if (!useSemanticSearch) {
    // No search query — traditional listing with filters
    const whereSQL = whereClauses.join(' AND ');

    let orderSQL;
    switch (sort) {
      case 'deadline':
        orderSQL = 'i.deadline ASC, i.created_at DESC';
        break;
      case 'salary':
        orderSQL = 'i.salary_max DESC, i.created_at DESC';
        break;
      case 'match':
        orderSQL = 'i.created_at DESC'; // match sort handled post-query
        break;
      case 'oldest':
        orderSQL = 'i.created_at ASC';
        break;
      case 'newest':
      default:
        orderSQL = 'i.created_at DESC';
        break;
    }

    const countSQL = `
      SELECT COUNT(*) AS total
      FROM internship i
      ${VISIBILITY_JOIN}
      WHERE ${whereSQL}
    `;
    const [countRows] = await pool.execute(countSQL, params);
    const total = countRows[0].total;

    const dataSQL = `
      SELECT
        i.internship_id, i.title, i.description, i.location,
        i.duration_months, i.work_type, i.salary_min, i.salary_max,
        i.deadline, i.created_at,
        e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id
      FROM internship i
      ${VISIBILITY_JOIN}
      WHERE ${whereSQL}
      ORDER BY ${orderSQL}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, String(limitNum), String(offset)];
    const [internships] = await pool.execute(dataSQL, dataParams);

    await attachSkillsToList(internships);

    if (req.user && req.user.role === 'student' && internships.length > 0) {
      const matchScope = req.query.match_scope === 'industry' ? 'industry' : 'all';
      await attachMatchScores(req.user.userId, internships, { scope: matchScope });
      if (sort === 'match') {
        internships.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }
    }

    return res.json({
      success: true,
      data: internships.map(formatInternshipListItem),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  }

  // ── Semantic search path ────────────────────────────────────────────
  // Step 1: Generate query embedding
  const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);

  // Step 2: Load all visible internship embeddings
  const filterWhereSQL = whereClauses.join(' AND ');
  const allSQL = `
    SELECT
      i.internship_id, i.title, i.description, i.location,
      i.duration_months, i.work_type, i.salary_min, i.salary_max,
      i.deadline, i.created_at,
      e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id,
      ie.embedding
    FROM internship i
    ${VISIBILITY_JOIN}
    LEFT JOIN internship_embedding ie ON ie.internship_id = i.internship_id
    WHERE ${filterWhereSQL}
  `;
  const [allInternships] = await pool.execute(allSQL, params);

  // Step 3: Score each internship by semantic relevance
  let scored = [];
  if (queryEmbedding) {
    for (const intern of allInternships) {
      let relevanceScore = 0;
      if (intern.embedding) {
        const emb = typeof intern.embedding === 'string' ? JSON.parse(intern.embedding) : intern.embedding;
        relevanceScore = embeddingService.cosineSimilarity(queryEmbedding, emb);
      }
      intern.relevanceScore = Math.max(0, relevanceScore);
      delete intern.embedding; // don't send to client
      scored.push(intern);
    }
  } else {
    // Fallback: no embedding available (Gemini key missing)
    // Use SQL LIKE as fallback
    const searchTerm = `%${searchQuery}%`;
    for (const intern of allInternships) {
      const titleMatch = (intern.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (intern.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const companyMatch = (intern.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      intern.relevanceScore = titleMatch ? 0.9 : descMatch ? 0.6 : companyMatch ? 0.5 : 0;
      delete intern.embedding;
      scored.push(intern);
    }
  }

  // Step 4: For short queries, merge with SQL LIKE keyword results to catch exact matches
  if (isShortQuery && queryEmbedding) {
    const scoredIds = new Set(scored.map((s) => s.internship_id));
    const searchTerm = `%${searchQuery}%`;
    const keywordSQL = `
      SELECT
        i.internship_id, i.title, i.description, i.location,
        i.duration_months, i.work_type, i.salary_min, i.salary_max,
        i.deadline, i.created_at,
        e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id
      FROM internship i
      ${VISIBILITY_JOIN}
      WHERE ${VISIBILITY_WHERE}
        AND (i.title LIKE ? OR i.description LIKE ? OR e.company_name LIKE ? OR i.location LIKE ?)
    `;
    const [keywordResults] = await pool.execute(keywordSQL, [searchTerm, searchTerm, searchTerm, searchTerm]);

    for (const kw of keywordResults) {
      if (!scoredIds.has(kw.internship_id)) {
        kw.relevanceScore = 0.4; // keyword-only match
        scored.push(kw);
      } else {
        // Boost existing entry if also keyword-matched
        const existing = scored.find((s) => s.internship_id === kw.internship_id);
        if (existing) existing.relevanceScore = Math.min(1, existing.relevanceScore + 0.1);
      }
    }
  }

  // Step 5: Filter out very low relevance (< 0.1)
  scored = scored.filter((s) => s.relevanceScore >= 0.1);

  // Step 6: Sort by relevance (default when searching), or user-chosen sort
  if (sort === 'relevance' || sort === 'newest') {
    // Default to relevance when searching
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } else if (sort === 'deadline') {
    scored.sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
      const db = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
      return da - db;
    });
  } else if (sort === 'salary') {
    scored.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
  }

  const total = scored.length;
  const paginated = scored.slice(offset, offset + limitNum);

  await attachSkillsToList(paginated);

  if (req.user && req.user.role === 'student' && paginated.length > 0) {
    await attachMatchScores(req.user.userId, paginated);
    if (sort === 'match') {
      paginated.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
  }

  // Attach relevance label
  for (const intern of paginated) {
    if (intern.relevanceScore >= 0.7) {
      intern.relevanceLabel = 'Highly Relevant';
    } else if (intern.relevanceScore >= 0.4) {
      intern.relevanceLabel = 'Relevant';
    } else {
      intern.relevanceLabel = 'Somewhat Relevant';
    }
  }

  const data = paginated.map((row) => ({
    ...formatInternshipListItem(row),
    relevanceScore: Math.round(row.relevanceScore * 100),
    relevanceLabel: row.relevanceLabel,
  }));

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

/**
 * GET /api/internships/featured
 * Featured/recent internships for landing page.
 */
const getFeatured = catchAsync(async (req, res) => {
  const [internships] = await pool.execute(
    `SELECT
      i.internship_id, i.title, i.description, i.location,
      i.duration_months, i.work_type, i.salary_min, i.salary_max,
      i.deadline, i.created_at,
      e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id
    FROM internship i
    ${VISIBILITY_JOIN}
    WHERE ${VISIBILITY_WHERE}
    ORDER BY i.created_at DESC
    LIMIT 6`
  );

  // Fetch skills for featured internships
  if (internships.length > 0) {
    const ids = internships.map((i) => i.internship_id);
    const placeholders = ids.map(() => '?').join(',');
    const [skills] = await pool.execute(
      `SELECT rs.internship_id, s.skill_id, s.display_name, rs.required_level, rs.is_mandatory
       FROM requires_skill rs
       JOIN skill s ON rs.skill_id = s.skill_id
       WHERE rs.internship_id IN (${placeholders})`,
      ids.map(String)
    );

    const skillMap = {};
    for (const sk of skills) {
      if (!skillMap[sk.internship_id]) skillMap[sk.internship_id] = [];
      skillMap[sk.internship_id].push({
        skillId: sk.skill_id,
        displayName: sk.display_name,
        requiredLevel: sk.required_level,
        isMandatory: !!sk.is_mandatory,
      });
    }

    for (const intern of internships) {
      intern.skills = skillMap[intern.internship_id] || [];
    }
  }

  res.json({
    success: true,
    data: internships.map(formatInternshipListItem),
  });
});

/**
 * GET /api/internships/stats
 * Platform stats for landing page.
 */
const getStats = catchAsync(async (req, res) => {
  const [[students], [companies], [activeInternships], [matchStats]] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'student' AND is_active = TRUE"),
    pool.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'employer' AND is_active = TRUE"),
    pool.execute(
      `SELECT COUNT(*) AS count FROM internship i
       ${VISIBILITY_JOIN}
       WHERE ${VISIBILITY_WHERE}`
    ),
    pool.execute(
      `SELECT AVG(match_score) AS avg_score, COUNT(*) AS count
       FROM application
       WHERE applied_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
         AND status != 'withdrawn'
         AND match_score IS NOT NULL`
    ),
  ]);

  const avgMatch = matchStats[0].count >= 10
    ? Math.round(Number(matchStats[0].avg_score))
    : null;

  res.json({
    success: true,
    data: {
      totalStudents: students[0].count,
      totalCompanies: companies[0].count,
      activeInternships: activeInternships[0].count,
      avgMatchScore: avgMatch,
    },
  });
});

/**
 * GET /api/internships/:id
 * Get internship details with optional auth.
 */
const getInternship = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Fetch the internship with employer info
  const [rows] = await pool.execute(
    `SELECT
      i.internship_id, i.employer_user_id, i.title, i.description, i.location,
      i.duration_months, i.work_type, i.salary_min, i.salary_max,
      i.status, i.admin_review_note, i.deadline, i.created_at, i.updated_at,
      e.company_name, e.company_logo, e.industry, e.company_size,
      e.company_description, e.website_url, e.linkedin_url, e.location AS company_location,
      u_emp.is_active AS employer_active
    FROM internship i
    JOIN employer e ON i.employer_user_id = e.user_id
    JOIN users u_emp ON e.user_id = u_emp.user_id
    WHERE i.internship_id = ?`,
    [String(id)]
  );

  if (rows.length === 0) {
    throw new AppError('Internship not found', 404);
  }

  const internship = rows[0];

  // Check visibility
  const isPubliclyVisible =
    internship.status === 'active' &&
    internship.employer_active &&
    (internship.deadline === null || new Date(internship.deadline) >= new Date(new Date().toISOString().split('T')[0]));

  if (!isPubliclyVisible) {
    // Only allow access to related users
    if (!req.user) {
      throw new AppError('Internship not found', 404);
    }

    const userId = req.user.userId;
    const role = req.user.role;

    let isRelated = false;

    if (role === 'admin') {
      isRelated = true;
    } else if (role === 'employer' && internship.employer_user_id === userId) {
      isRelated = true;
    } else if (role === 'student') {
      // Check if student applied
      const [apps] = await pool.execute(
        'SELECT application_id FROM application WHERE student_user_id = ? AND internship_id = ? LIMIT 1',
        [String(userId), String(id)]
      );
      isRelated = apps.length > 0;
    }

    if (!isRelated) {
      throw new AppError('Internship not found', 404);
    }
  }

  // Fetch required skills
  const [skills] = await pool.execute(
    `SELECT s.skill_id, s.display_name, rs.required_level, rs.is_mandatory
     FROM requires_skill rs
     JOIN skill s ON rs.skill_id = s.skill_id
     WHERE rs.internship_id = ?`,
    [String(id)]
  );

  // Fetch applicant count (for employer/admin)
  let applicantCount = 0;
  if (req.user && (req.user.role === 'employer' || req.user.role === 'admin')) {
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) AS count FROM application WHERE internship_id = ?',
      [String(id)]
    );
    applicantCount = countRows[0].count;
  }

  // View logging: only for logged-in students viewing publicly visible internships
  if (req.user && req.user.role === 'student' && isPubliclyVisible) {
    pool.execute(
      'INSERT INTO internship_view (internship_id, viewer_user_id) VALUES (?, ?)',
      [String(id), String(req.user.userId)]
    ).catch(() => {}); // fire-and-forget
  }

  // Build response
  const data = {
    internshipId: internship.internship_id,
    title: internship.title,
    description: internship.description,
    location: internship.location,
    durationMonths: internship.duration_months,
    workType: internship.work_type,
    salaryMin: internship.salary_min ? Number(internship.salary_min) : null,
    salaryMax: internship.salary_max ? Number(internship.salary_max) : null,
    status: internship.status,
    deadline: internship.deadline,
    createdAt: internship.created_at,
    updatedAt: internship.updated_at,
    employer: {
      userId: internship.employer_user_id,
      companyName: internship.company_name,
      companyLogo: internship.company_logo,
      industry: internship.industry,
      companySize: internship.company_size,
      companyDescription: internship.company_description,
      websiteUrl: internship.website_url,
      linkedinUrl: internship.linkedin_url,
      location: internship.company_location,
    },
    skills: skills.map((s) => ({
      skillId: s.skill_id,
      displayName: s.display_name,
      requiredLevel: s.required_level,
      isMandatory: !!s.is_mandatory,
    })),
    applicantCount,
    isActive: isPubliclyVisible,
  };

  // Student personalization: match_score, skill_comparison, match_breakdown
  if (req.user && req.user.role === 'student') {
    const matchData = await computeStudentMatch(req.user.userId, internship.internship_id, skills);
    data.matchScore = matchData.score;
    data.skillComparison = matchData.skillComparison;
    data.matchBreakdown = matchData.breakdown;

    // Check if student has bookmarked this internship
    const [bookmarks] = await pool.execute(
      'SELECT 1 FROM bookmark WHERE student_user_id = ? AND internship_id = ? LIMIT 1',
      [String(req.user.userId), String(id)]
    );
    data.isBookmarked = bookmarks.length > 0;

    // Check if student has applied
    const [apps] = await pool.execute(
      'SELECT application_id, status FROM application WHERE student_user_id = ? AND internship_id = ? LIMIT 1',
      [String(req.user.userId), String(id)]
    );
    data.hasApplied = apps.length > 0;
    if (apps.length > 0) {
      data.applicationStatus = apps[0].status;
    }
  }

  res.json({ success: true, data });
});

// ── Helpers ──

/**
 * Attach required skills to a list of internship rows (batch load).
 */
async function attachSkillsToList(internships) {
  if (internships.length === 0) return;
  const ids = internships.map((i) => i.internship_id);
  const placeholders = ids.map(() => '?').join(',');
  const [skills] = await pool.execute(
    `SELECT rs.internship_id, s.skill_id, s.display_name, rs.required_level, rs.is_mandatory
     FROM requires_skill rs
     JOIN skill s ON rs.skill_id = s.skill_id
     WHERE rs.internship_id IN (${placeholders})`,
    ids.map(String)
  );

  const skillMap = {};
  for (const sk of skills) {
    if (!skillMap[sk.internship_id]) skillMap[sk.internship_id] = [];
    skillMap[sk.internship_id].push({
      skillId: sk.skill_id,
      displayName: sk.display_name,
      requiredLevel: sk.required_level,
      isMandatory: !!sk.is_mandatory,
    });
  }

  for (const intern of internships) {
    intern.skills = skillMap[intern.internship_id] || [];
  }
}

/**
 * Format an internship row for list responses.
 */
function formatInternshipListItem(row) {
  return {
    internshipId: row.internship_id,
    title: row.title,
    description: row.description && row.description.length > 200
      ? row.description.substring(0, 200) + '...'
      : row.description,
    location: row.location,
    durationMonths: row.duration_months,
    workType: row.work_type,
    salaryMin: row.salary_min ? Number(row.salary_min) : null,
    salaryMax: row.salary_max ? Number(row.salary_max) : null,
    deadline: row.deadline,
    createdAt: row.created_at,
    employer: {
      userId: row.employer_user_id,
      companyName: row.company_name,
      companyLogo: row.company_logo,
      industry: row.industry,
    },
    skills: row.skills || [],
    matchScore: row.matchScore ?? null,
  };
}

/**
 * Attach match scores to internship list items for a student.
 * Full formula: (Skill × 0.65) + (Semantic × 0.20) + (Profile Bonus × 0.15)
 * Missing embedding fallback: (Skill × 0.80) + (Profile × 0.20)
 */
const MAJOR_INDUSTRY_KEYWORDS = {
  Technology: ['computer', 'software', 'information', 'data', 'ai', 'machine', 'cyber', 'programming', 'it'],
  Finance: ['finance', 'accounting', 'banking', 'economics', 'investment', 'actuarial'],
  Healthcare: ['medical', 'health', 'nursing', 'pharmacy', 'biomedical', 'dentistry', 'medicine'],
  Education: ['education', 'teaching', 'pedagog'],
  Marketing: ['marketing', 'advertising', 'branding', 'communication', 'public relations'],
  Engineering: ['mechanical', 'electrical', 'civil', 'chemical', 'industrial', 'architecture', 'engineer'],
};

function deriveIndustryFromMajor(major) {
  if (!major) return null;
  const m = major.toLowerCase();
  for (const [industry, keywords] of Object.entries(MAJOR_INDUSTRY_KEYWORDS)) {
    if (keywords.some((kw) => m.includes(kw))) return industry;
  }
  return null;
}

async function attachMatchScores(studentUserId, internships, options = {}) {
  const { scope = 'all' } = options;

  let studentIndustry = null;
  if (scope === 'industry') {
    const [rows] = await pool.execute(
      `SELECT major FROM student WHERE user_id = ?`,
      [String(studentUserId)]
    );
    studentIndustry = rows[0] ? deriveIndustryFromMajor(rows[0].major) : null;
  }

  const [studentSkills] = await pool.execute(
    `SELECT hs.skill_id, s.normalized_name, hs.proficiency_level
     FROM has_skill hs
     JOIN skill s ON hs.skill_id = s.skill_id
     WHERE hs.student_user_id = ?`,
    [String(studentUserId)]
  );

  const profileBonus = await computeProfileBonus(studentUserId);

  const studentSkillMap = {};
  for (const sk of studentSkills) {
    studentSkillMap[sk.skill_id] = sk.proficiency_level;
  }

  for (const intern of internships) {
    if (scope === 'industry' && studentIndustry && intern.industry !== studentIndustry) {
      intern.matchScore = null;
      continue;
    }

    const skills = intern.skills || [];
    if (skills.length === 0) {
      intern.matchScore = Math.round(profileBonus * 20);
      continue;
    }

    const skillScore = computeSkillScore(skills, studentSkillMap);
    const semanticScore = await embeddingService.computeSemanticScore(studentUserId, intern.internshipId);

    if (semanticScore !== null) {
      intern.matchScore = Math.round(skillScore * 0.65 + semanticScore * 0.20 + profileBonus * 100 * 0.15);
    } else {
      intern.matchScore = Math.round(skillScore * 0.80 + profileBonus * 100 * 0.20);
    }
  }
}

/**
 * Compute a detailed match for a single internship (for detail page).
 */
async function computeStudentMatch(studentUserId, internshipId, requiredSkills) {
  const [studentSkills] = await pool.execute(
    `SELECT hs.skill_id, s.display_name, s.normalized_name, hs.proficiency_level
     FROM has_skill hs
     JOIN skill s ON hs.skill_id = s.skill_id
     WHERE hs.student_user_id = ?`,
    [String(studentUserId)]
  );

  const profileBonus = await computeProfileBonus(studentUserId);

  const studentSkillMap = {};
  const studentSkillNames = {};
  for (const sk of studentSkills) {
    studentSkillMap[sk.skill_id] = sk.proficiency_level;
    studentSkillNames[sk.skill_id] = sk.display_name;
  }

  // Build skill comparison
  const skillComparison = requiredSkills.map((rs) => {
    const studentLevel = studentSkillMap[rs.skill_id] || null;
    return {
      skillName: rs.display_name,
      requiredLevel: rs.required_level,
      studentLevel,
      isMandatory: !!rs.is_mandatory,
      matched: !!studentLevel,
    };
  });

  const skillScore = computeSkillScore(
    requiredSkills.map((s) => ({
      skillId: s.skill_id,
      requiredLevel: s.required_level,
      isMandatory: !!s.is_mandatory,
    })),
    studentSkillMap
  );

  const semanticScore = await embeddingService.computeSemanticScore(studentUserId, internshipId);
  const profileBonusPct = Math.round(profileBonus * 100);

  let totalScore;
  if (semanticScore !== null) {
    totalScore = Math.round(skillScore * 0.65 + semanticScore * 0.20 + profileBonusPct * 0.15);
  } else {
    totalScore = Math.round(skillScore * 0.80 + profileBonusPct * 0.20);
  }

  return {
    score: totalScore,
    skillComparison,
    breakdown: {
      skillScore: Math.round(skillScore),
      semanticScore,
      profileBonus: profileBonusPct,
    },
  };
}

/**
 * Compute skill match score (0-100).
 * Mandatory skills weighted 75%, optional 25%.
 * Partial credit: one level below = 0.6, two levels below = 0.3
 */
function computeSkillScore(requiredSkills, studentSkillMap) {
  if (requiredSkills.length === 0) return 0;

  const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };

  const mandatory = requiredSkills.filter((s) => s.isMandatory);
  const optional = requiredSkills.filter((s) => !s.isMandatory);

  function scoreGroup(group) {
    if (group.length === 0) return 1; // full credit if none required
    let total = 0;
    for (const skill of group) {
      const studentLevel = studentSkillMap[skill.skillId];
      if (!studentLevel) {
        total += 0; // no match
        continue;
      }
      const required = LEVEL_ORDER[skill.requiredLevel] ?? 1;
      const actual = LEVEL_ORDER[studentLevel] ?? 1;
      const diff = required - actual;
      if (diff <= 0) {
        total += 1; // meets or exceeds
      } else if (diff === 1) {
        total += 0.6; // one level below
      } else {
        total += 0.3; // two levels below
      }
    }
    return total / group.length;
  }

  const mandatoryScore = scoreGroup(mandatory);
  const optionalScore = scoreGroup(optional);

  // Weight: mandatory 75%, optional 25%
  const hasMandatory = mandatory.length > 0;
  const hasOptional = optional.length > 0;

  if (hasMandatory && hasOptional) {
    return (mandatoryScore * 0.75 + optionalScore * 0.25) * 100;
  } else if (hasMandatory) {
    return mandatoryScore * 100;
  } else {
    return optionalScore * 100;
  }
}

/**
 * Compute profile completeness bonus (0-1 scale).
 */
async function computeProfileBonus(studentUserId) {
  const [rows] = await pool.execute(
    `SELECT s.bio, s.phone, s.linkedin_url, s.gpa, s.location,
            s.university, s.major, s.graduation_year, s.primary_resume_id,
            u.full_name
     FROM student s
     JOIN users u ON s.user_id = u.user_id
     WHERE s.user_id = ?`,
    [String(studentUserId)]
  );

  if (rows.length === 0) return 0;
  const p = rows[0];

  let score = 0;
  if (p.full_name) score += 15;
  if (p.university) score += 10;
  if (p.major) score += 10;
  if (p.graduation_year) score += 5;
  if (p.gpa) score += 5;
  if (p.bio) score += 10;
  if (p.phone) score += 5;
  if (p.linkedin_url) score += 5;
  if (p.location) score += 5;
  if (p.primary_resume_id) score += 15;

  // Count skills
  const [skillRows] = await pool.execute(
    'SELECT COUNT(*) AS count FROM has_skill WHERE student_user_id = ?',
    [String(studentUserId)]
  );
  const skillCount = skillRows[0].count;
  score += Math.min(15, skillCount * 3);

  return Math.min(100, score) / 100;
}

module.exports = {
  listInternships,
  getFeatured,
  getStats,
  getInternship,
  // Shared scoring helpers (used by studentController for recommendations)
  computeSkillScore,
  computeProfileBonus,
  formatInternshipListItem,
};
