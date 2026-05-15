// Matching engine. Single source of truth for student/internship match scores.
//
// Pure-function shape: score(input) -> { finalScore, breakdown, alerts }.
// Callers (controllers, cache) load the data, call score(), and store/return
// the result. This module never touches the DB.
//
// Algorithm summary (see /plans for full design):
//   Final = 60% Mandatory Skills + 10% Optional Skills + 10% Major Fit
//         + 10% GPA Fit + 10% Location Fit
//   Then: cap by min of ratio-based mandatory caps and country-mismatch cap.
//   Then: tiebreak by deadline (handled by caller when sorting).

const { WEIGHTS, LEVEL_VALUE, LEVEL_CREDIT, MAJOR_FIT } = require('../config/scoring');
const { resolveMajorFields } = require('../config/majorFieldMap');

// ---------------------------------------------------------------------------
// Per-skill credit
// ---------------------------------------------------------------------------
function levelCredit(requiredLevel, studentLevel) {
  if (!studentLevel) return 0;
  const req = LEVEL_VALUE[requiredLevel] || LEVEL_VALUE.beginner;
  const has = LEVEL_VALUE[studentLevel] || LEVEL_VALUE.beginner;
  if (has >= req) return 1.0;
  const diff = req - has;
  return LEVEL_CREDIT[diff] ?? 0;
}

// ---------------------------------------------------------------------------
// Stage 2 — signal scores
// ---------------------------------------------------------------------------
function scoreSkillBucket(skills, studentSkillMap, weight) {
  if (!skills || skills.length === 0) {
    return { score: weight, matched: [], missing: [], partial: [] };
  }
  const pointsPerSkill = weight / skills.length;
  let total = 0;
  const matched = [];
  const partial = [];
  const missing = [];

  for (const s of skills) {
    const studentLevel = studentSkillMap[s.skill_id];
    if (!studentLevel) {
      missing.push({ skillId: s.skill_id, name: s.display_name || s.name });
      continue;
    }
    const credit = levelCredit(s.required_level, studentLevel);
    total += pointsPerSkill * credit;
    if (credit >= 1) {
      matched.push({ skillId: s.skill_id, name: s.display_name || s.name });
    } else if (credit > 0) {
      partial.push({ skillId: s.skill_id, name: s.display_name || s.name, credit });
    } else {
      missing.push({ skillId: s.skill_id, name: s.display_name || s.name });
    }
  }

  return { score: total, matched, partial, missing };
}

function scoreMajor(student, internship) {
  const fields = resolveMajorFields(student.major);
  const industry = internship.industry;
  if (!industry || !fields.primary) {
    return { score: MAJOR_FIT.none, fit: 'none' };
  }
  if (industry === fields.primary) {
    return { score: MAJOR_FIT.primary, fit: 'primary' };
  }
  if (fields.related.includes(industry)) {
    return { score: MAJOR_FIT.related, fit: 'related' };
  }
  return { score: MAJOR_FIT.none, fit: 'none' };
}

function scoreGpa(student, internship) {
  const min = internship.minimum_gpa;
  const gpa = student.gpa;
  if (min == null) return { score: WEIGHTS.gpa, reason: 'no_minimum' };
  if (gpa == null) return { score: WEIGHTS.gpa, reason: 'no_student_gpa' };
  if (Number(gpa) >= Number(min)) return { score: WEIGHTS.gpa, reason: 'meets_minimum' };
  const ratio = Number(gpa) / Number(min);
  return {
    score: Math.max(0, ratio * WEIGHTS.gpa),
    reason: 'below_minimum',
    studentGpa: Number(gpa),
    minGpa: Number(min),
  };
}

function sameCity(a, b) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function scoreLocation(student, internship) {
  const work = internship.work_type;
  if (work === 'remote') {
    return { score: WEIGHTS.location, fit: 'remote', alert: null, countryMismatch: false };
  }
  const sCity = student.city;
  const sCountry = student.country;
  const iCity = internship.city;
  const iCountry = internship.country;
  const cityMatch = sameCity(sCity, iCity);
  const countryMatch = sameCity(sCountry, iCountry);

  if (cityMatch && countryMatch) {
    return { score: WEIGHTS.location, fit: 'same_city', alert: null, countryMismatch: false };
  }

  if (countryMatch) {
    // Different city, same country.
    const alert = work === 'on-site'
      ? `This internship is on-site in ${iCity || 'a different city'}, but your saved location is ${sCity || 'a different city'}. Attendance may be difficult.`
      : null; // hybrid + same country, different city: no alert per spec
    return { score: 5, fit: 'different_city_same_country', alert, countryMismatch: false };
  }

  // Different country (or country missing).
  const alert = work === 'on-site'
    ? `This internship is on-site in ${iCountry || 'another country'}, but your saved location is in ${sCountry || 'another country'}. The match may not be practical.`
    : `This internship is hybrid in ${iCountry || 'another country'}, but your saved location is in ${sCountry || 'another country'}. The match may not be practical.`;
  return { score: 0, fit: 'different_country', alert, countryMismatch: true };
}

// ---------------------------------------------------------------------------
// Stage 3 — caps
// ---------------------------------------------------------------------------
function computeMandatoryCap(missingCount, mandatoryTotal) {
  if (mandatoryTotal === 0 || missingCount === 0) return null;
  const ratio = missingCount / mandatoryTotal;
  if (ratio >= 0.70) return { value: 40, reason: 'most_mandatory_skills_missing' };
  if (ratio  > 0.50) return { value: 50, reason: 'majority_mandatory_skills_missing' };
  return null;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
//
// Input shape:
//   student = {
//     user_id, major, gpa, city, country,
//     skills: [{ skill_id, proficiency_level }, ...]
//   }
//   internship = {
//     internship_id, industry, city, country, work_type, minimum_gpa, deadline,
//     mandatorySkills: [{ skill_id, display_name, required_level }, ...],
//     optionalSkills:  [{ skill_id, display_name, required_level }, ...],
//   }
//
// Output:
//   { finalScore, breakdown: {...}, alerts: [string, ...] }
//
function score({ student, internship }) {
  const studentSkillMap = {};
  for (const s of student.skills || []) {
    studentSkillMap[s.skill_id] = s.proficiency_level || 'beginner';
  }

  const mandatory = scoreSkillBucket(internship.mandatorySkills, studentSkillMap, WEIGHTS.mandatory);
  const optional  = scoreSkillBucket(internship.optionalSkills,  studentSkillMap, WEIGHTS.optional);
  const major     = scoreMajor(student, internship);
  const gpa       = scoreGpa(student, internship);
  const location  = scoreLocation(student, internship);

  const rawScore = mandatory.score + optional.score + major.score + gpa.score + location.score;

  // Cap collection (ratio-based mandatory + country-mismatch).
  const caps = [];
  const mandatoryTotal = (internship.mandatorySkills || []).length;
  const missingCount = mandatory.missing.length;
  const mandatoryCap = computeMandatoryCap(missingCount, mandatoryTotal);
  if (mandatoryCap) caps.push(mandatoryCap);
  if (location.countryMismatch) caps.push({ value: 50, reason: 'country_mismatch' });

  let finalScore = rawScore;
  let bindingCap = null;
  if (caps.length > 0) {
    bindingCap = caps.reduce((acc, c) => (acc.value <= c.value ? acc : c));
    if (finalScore > bindingCap.value) finalScore = bindingCap.value;
  }
  finalScore = Math.round(finalScore * 100) / 100;

  const alerts = [];
  if (location.alert) alerts.push(location.alert);

  return {
    finalScore,
    breakdown: {
      mandatory: {
        weight: WEIGHTS.mandatory,
        score:  Math.round(mandatory.score * 100) / 100,
        matched: mandatory.matched,
        partial: mandatory.partial,
        missing: mandatory.missing,
        total: mandatoryTotal,
      },
      optional: {
        weight: WEIGHTS.optional,
        score:  Math.round(optional.score * 100) / 100,
        matched: optional.matched,
        partial: optional.partial,
        missing: optional.missing,
        total: (internship.optionalSkills || []).length,
      },
      major: {
        weight: WEIGHTS.major,
        score:  major.score,
        fit:    major.fit,
        studentMajor: student.major,
        internshipIndustry: internship.industry,
      },
      gpa: {
        weight: WEIGHTS.gpa,
        score:  Math.round(gpa.score * 100) / 100,
        reason: gpa.reason,
        studentGpa: student.gpa != null ? Number(student.gpa) : null,
        minimumGpa: internship.minimum_gpa != null ? Number(internship.minimum_gpa) : null,
      },
      location: {
        weight: WEIGHTS.location,
        score:  location.score,
        fit:    location.fit,
        workType: internship.work_type,
      },
      rawScore: Math.round(rawScore * 100) / 100,
      capsApplied: caps,
      bindingCap,
      alerts,
    },
    alerts,
  };
}

module.exports = {
  score,
  // Exported for tests:
  _internal: {
    levelCredit,
    scoreSkillBucket,
    scoreMajor,
    scoreGpa,
    scoreLocation,
    computeMandatoryCap,
  },
};
