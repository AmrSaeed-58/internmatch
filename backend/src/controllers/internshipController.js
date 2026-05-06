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

const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'for', 'from', 'i', 'in', 'intern',
  'internship', 'internships', 'is', 'job', 'jobs', 'me', 'of', 'on', 'or', 'role',
  'roles', 'the', 'to', 'with',
]);

const SEARCH_TOKEN_ALIASES = {
  website: 'web',
  websites: 'web',
  webpage: 'web',
  webpages: 'web',
  site: 'web',
  sites: 'web',
  frontend: 'frontend',
  front: 'frontend',
  ui: 'frontend',
  interface: 'frontend',
  interfaces: 'frontend',
  building: 'build',
  build: 'build',
  builds: 'build',
  built: 'build',
  creating: 'build',
  create: 'build',
  creates: 'build',
  developing: 'develop',
  develop: 'develop',
  develops: 'develop',
  developed: 'develop',
};

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSearchToken(token) {
  return SEARCH_TOKEN_ALIASES[token] || token;
}

function tokenizeSearchQuery(query) {
  const normalized = normalizeSearchText(query);
  const tokens = normalized
    .split(' ')
    .map((token) => token.trim())
    .map(normalizeSearchToken)
    .filter((token) => token.length > 1 && !SEARCH_STOP_WORDS.has(token));
  const uniqueTokens = [...new Set(tokens)];

  return {
    normalized: uniqueTokens.join(' '),
    tokens: uniqueTokens,
  };
}

function scoreField(value, tokens, normalizedQuery) {
  const text = normalizeSearchText(value)
    .split(' ')
    .map(normalizeSearchToken)
    .join(' ');
  if (!text) return 0;

  let score = 0;
  if (normalizedQuery && text.includes(normalizedQuery)) {
    score += 0.65;
  }

  if (tokens.length > 0) {
    const matched = tokens.filter((token) => text.includes(token)).length;
    score += (matched / tokens.length) * 0.35;
  }

  return Math.min(1, score);
}

function scoreLexicalRelevance(internship, queryParts) {
  const { normalized, tokens } = queryParts;
  const weightedScore =
    scoreField(internship.title, tokens, normalized) * 0.42 +
    scoreField(internship.skill_names, tokens, normalized) * 0.34 +
    scoreField(internship.description, tokens, normalized) * 0.24;

  return Math.min(1, weightedScore);
}

function fieldHasSearchTerm(value, queryParts) {
  const text = normalizeSearchText(value)
    .split(' ')
    .map(normalizeSearchToken)
    .join(' ');
  if (!text || queryParts.tokens.length === 0) return false;
  if (queryParts.normalized && text.includes(queryParts.normalized)) return true;
  return queryParts.tokens.some((token) => text.includes(token));
}

function hasDirectSearchMatch(internship, queryParts) {
  if (queryParts.tokens.length === 0) return false;

  if (
    fieldHasSearchTerm(internship.title, queryParts) ||
    fieldHasSearchTerm(internship.skill_names, queryParts)
  ) {
    return true;
  }

  const description = normalizeSearchText(internship.description)
    .split(' ')
    .map(normalizeSearchToken)
    .join(' ');
  if (!description) return false;
  const matchedDescriptionTokens = queryParts.tokens.filter((token) => description.includes(token)).length;
  return matchedDescriptionTokens >= Math.max(1, Math.ceil(queryParts.tokens.length * 0.6));
}

function parseEmbeddingValue(value) {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeSemanticSimilarity(similarity) {
  if (!Number.isFinite(similarity)) return 0;
  return Math.max(0, Math.min(1, (similarity - 0.62) / 0.22));
}

function compareDatesDesc(a, b) {
  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
}

function compareSearchResults(sort) {
  return (a, b) => {
    if (sort === 'deadline') {
      const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return deadlineA - deadlineB || b.relevanceScore - a.relevanceScore || compareDatesDesc(a, b);
    }

    if (sort === 'salary') {
      return (Number(b.salary_max) || 0) - (Number(a.salary_max) || 0)
        || b.relevanceScore - a.relevanceScore
        || compareDatesDesc(a, b);
    }

    if (sort === 'match') {
      return (b.matchScore || 0) - (a.matchScore || 0)
        || b.relevanceScore - a.relevanceScore
        || compareDatesDesc(a, b);
    }

    if (sort === 'oldest') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0)
        || b.relevanceScore - a.relevanceScore;
    }

    return b.relevanceScore - a.relevanceScore || compareDatesDesc(a, b);
  };
}

function assignRelevanceLabel(internship) {
  if (internship.relevanceScore >= 0.75) {
    internship.relevanceLabel = 'Highly Relevant';
  } else if (internship.relevanceScore >= 0.45) {
    internship.relevanceLabel = 'Relevant';
  } else {
    internship.relevanceLabel = 'Related';
  }
}

function queueMissingInternshipEmbeddings(internshipIds) {
  if (!process.env.GEMINI_API_KEY || internshipIds.length === 0) return;
  for (const internshipId of internshipIds.slice(0, 25)) {
    embeddingService.updateInternshipEmbedding(internshipId).catch(() => {});
  }
}

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
  const useSearch = !!searchQuery;

  if (!useSearch) {
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
        orderSQL = 'i.created_at DESC';
        break;
      case 'oldest':
        orderSQL = 'i.created_at ASC';
        break;
      case 'newest':
      default:
        orderSQL = 'i.created_at DESC';
        break;
    }

    if (sort === 'match' && req.user && req.user.role === 'student') {
      const allSQL = `
        SELECT
          i.internship_id, i.title, i.description, i.location,
          i.duration_months, i.work_type, i.salary_min, i.salary_max,
          i.deadline, i.created_at,
          e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id
        FROM internship i
        ${VISIBILITY_JOIN}
        WHERE ${whereSQL}
      `;
      const [allInternships] = await pool.execute(allSQL, params);
      await attachSkillsToList(allInternships);

      const matchScope = req.query.match_scope === 'industry' ? 'industry' : 'all';
      await attachMatchScores(req.user.userId, allInternships, { scope: matchScope });
      allInternships.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || compareDatesDesc(a, b));

      const total = allInternships.length;
      const paginated = allInternships.slice(offset, offset + limitNum);
      queueMissingInternshipEmbeddings(paginated.map((intern) => intern.internship_id));
      await attachApplicationState(req.user.userId, paginated);

      return res.json({
        success: true,
        data: paginated.map(formatInternshipListItem),
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
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
    queueMissingInternshipEmbeddings(internships.map((intern) => intern.internship_id));

    await attachSkillsToList(internships);

    if (req.user && req.user.role === 'student' && internships.length > 0) {
      const matchScope = req.query.match_scope === 'industry' ? 'industry' : 'all';
      await attachMatchScores(req.user.userId, internships, { scope: matchScope });
      await attachApplicationState(req.user.userId, internships);
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

  const queryParts = tokenizeSearchQuery(searchQuery);
  const queryEmbedding = queryParts.tokens.length > 0
    ? await embeddingService.generateEmbedding(queryParts.normalized)
    : null;

  const filterWhereSQL = whereClauses.join(' AND ');
  const allSQL = `
    SELECT
      i.internship_id, i.title, i.description, i.location,
      i.duration_months, i.work_type, i.salary_min, i.salary_max,
      i.deadline, i.created_at,
      e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id,
      skill_search.skill_names,
      ie.embedding
    FROM internship i
    ${VISIBILITY_JOIN}
    LEFT JOIN (
      SELECT rs.internship_id, GROUP_CONCAT(s.display_name SEPARATOR ' ') AS skill_names
      FROM requires_skill rs
      JOIN skill s ON s.skill_id = rs.skill_id
      GROUP BY rs.internship_id
    ) skill_search ON skill_search.internship_id = i.internship_id
    LEFT JOIN internship_embedding ie ON ie.internship_id = i.internship_id
    WHERE ${filterWhereSQL}
  `;
  const [allInternships] = await pool.execute(allSQL, params);

  const missingEmbeddingIds = [];
  let scored = allInternships.map((intern) => {
    const lexicalScore = scoreLexicalRelevance(intern, queryParts);
    const directMatch = hasDirectSearchMatch(intern, queryParts);
    const storedEmbedding = parseEmbeddingValue(intern.embedding);
    let semanticScore = 0;

    if (queryEmbedding && storedEmbedding) {
      semanticScore = normalizeSemanticSimilarity(
        embeddingService.cosineSimilarity(queryEmbedding, storedEmbedding)
      );
    } else if (queryEmbedding && !storedEmbedding) {
      missingEmbeddingIds.push(intern.internship_id);
    }

    const relevanceScore = queryEmbedding && storedEmbedding
      ? Math.max((semanticScore * 0.65) + (lexicalScore * 0.35), lexicalScore * 0.92)
      : lexicalScore;

    delete intern.embedding;
    delete intern.skill_names;

    return {
      ...intern,
      relevanceScore: Math.min(1, relevanceScore),
      semanticScore,
      lexicalScore,
      directMatch,
    };
  });

  queueMissingInternshipEmbeddings(missingEmbeddingIds);

  scored = scored.filter((intern) => (
    intern.directMatch ||
    intern.semanticScore >= 0.45 ||
    intern.lexicalScore >= 0.12
  ));
  await attachSkillsToList(scored);

  const matchScope = req.query.match_scope === 'industry' ? 'industry' : 'all';
  if (req.user && req.user.role === 'student' && scored.length > 0) {
    await attachMatchScores(req.user.userId, scored, { scope: matchScope });
  }

  scored.sort(compareSearchResults(sort));

  const total = scored.length;
  const paginated = scored.slice(offset, offset + limitNum);

  if (req.user && req.user.role === 'student' && paginated.length > 0) {
    await attachApplicationState(req.user.userId, paginated);
  }

  for (const intern of paginated) {
    assignRelevanceLabel(intern);
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

const getInternship = catchAsync(async (req, res) => {
  const { id } = req.params;

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

  const data = {
    internshipId: internship.internship_id,
    title: internship.title,
    description: internship.description,
    location: internship.location,
    durationMonths: internship.duration_months,
    workType: internship.work_type,
    salaryMin: internship.salary_min == null ? null : Number(internship.salary_min),
    salaryMax: internship.salary_max == null ? null : Number(internship.salary_max),
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

    const [bookmarks] = await pool.execute(
      'SELECT 1 FROM bookmark WHERE student_user_id = ? AND internship_id = ? LIMIT 1',
      [String(req.user.userId), String(id)]
    );
    data.isBookmarked = bookmarks.length > 0;

    const [apps] = await pool.execute(
      'SELECT application_id, status FROM application WHERE student_user_id = ? AND internship_id = ? LIMIT 1',
      [String(req.user.userId), String(id)]
    );
    data.hasApplied = apps.length > 0 && apps[0].status !== 'withdrawn';
    if (apps.length > 0) {
      data.applicationStatus = apps[0].status;
    }
  }

  res.json({ success: true, data });
});

const getEmployerProfile = catchAsync(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.execute(
    `SELECT
       u.user_id, u.full_name, u.email,
       e.company_name, e.industry, e.company_size, e.company_description,
       e.company_logo, e.website_url, e.linkedin_url, e.twitter_url,
       e.facebook_url, e.instagram_url, e.location
     FROM users u
     JOIN employer e ON e.user_id = u.user_id
     WHERE u.user_id = ? AND u.role = 'employer' AND u.is_active = 1`,
    [String(id)]
  );

  if (rows.length === 0) throw new AppError('Employer profile not found', 404);

  const [internships] = await pool.execute(
    `SELECT
       i.internship_id, i.title, i.description, i.location,
       i.duration_months, i.work_type, i.salary_min, i.salary_max,
       i.deadline, i.created_at,
       e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id
     FROM internship i
     JOIN employer e ON e.user_id = i.employer_user_id
     WHERE i.employer_user_id = ?
       AND i.status = 'active'
       AND (i.deadline IS NULL OR i.deadline >= CURDATE())
     ORDER BY i.created_at DESC
     LIMIT 12`,
    [String(id)]
  );

  await attachSkillsToList(internships);
  if (req.user && req.user.role === 'student') {
    await attachMatchScores(req.user.userId, internships, { scope: 'all' });
    await attachApplicationState(req.user.userId, internships);
  }

  const e = rows[0];
  res.json({
    success: true,
    data: {
      userId: e.user_id,
      contactName: e.full_name,
      email: e.email,
      companyName: e.company_name,
      industry: e.industry,
      companySize: e.company_size,
      companyDescription: e.company_description,
      companyLogo: e.company_logo,
      websiteUrl: e.website_url,
      linkedinUrl: e.linkedin_url,
      twitterUrl: e.twitter_url,
      facebookUrl: e.facebook_url,
      instagramUrl: e.instagram_url,
      location: e.location,
      internships: internships.map(formatInternshipListItem),
    },
  });
});

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
    salaryMin: row.salary_min == null ? null : Number(row.salary_min),
    salaryMax: row.salary_max == null ? null : Number(row.salary_max),
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
    hasApplied: row.hasApplied ?? false,
    applicationStatus: row.applicationStatus ?? null,
    isBookmarked: row.isBookmarked ?? false,
  };
}

async function attachApplicationState(studentUserId, internships) {
  if (internships.length === 0) return;
  const ids = internships.map((i) => i.internship_id);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT internship_id, status FROM application
     WHERE student_user_id = ? AND internship_id IN (${placeholders})`,
    [String(studentUserId), ...ids.map(String)]
  );

  const stateMap = {};
  for (const r of rows) {
    stateMap[r.internship_id] = r.status;
  }

  for (const intern of internships) {
    const status = stateMap[intern.internship_id];
    intern.hasApplied = !!status && status !== 'withdrawn';
    intern.applicationStatus = status || null;
  }

  const [bookmarkRows] = await pool.execute(
    `SELECT internship_id FROM bookmark
     WHERE student_user_id = ? AND internship_id IN (${placeholders})`,
    [String(studentUserId), ...ids.map(String)]
  );
  const bookmarked = new Set(bookmarkRows.map((r) => r.internship_id));

  for (const intern of internships) {
    intern.isBookmarked = bookmarked.has(intern.internship_id);
  }
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
 * Weights only optional fields — mandatory signup fields (full_name, university,
 * major, graduation_year) are excluded since they're always present and would
 * force a baseline score of ~40 on every account.
 *
 * Total weights sum to 100:
 *   resume:       30  (drives skill extraction + content matching)
 *   skills:       25  (5 each, capped at 5 skills)
 *   bio:          15  (free-text signal for semantic matching)
 *   linkedin_url: 10
 *   gpa:           5
 *   phone:         5
 *   location:      5
 *   github_url:    5
 */
async function computeProfileBonus(studentUserId) {
  const [rows] = await pool.execute(
    `SELECT s.bio, s.phone, s.linkedin_url, s.github_url, s.gpa, s.location,
            s.primary_resume_id
     FROM student s
     WHERE s.user_id = ?`,
    [String(studentUserId)]
  );

  if (rows.length === 0) return 0;
  const p = rows[0];

  let score = 0;
  if (p.primary_resume_id) score += 30;
  if (p.bio && p.bio.trim().length >= 30) score += 15;
  if (p.linkedin_url) score += 10;
  if (p.gpa) score += 5;
  if (p.phone) score += 5;
  if (p.location) score += 5;
  if (p.github_url) score += 5;

  // Skills: 5 points each, max 5 skills counted (25 pts)
  const [skillRows] = await pool.execute(
    'SELECT COUNT(*) AS count FROM has_skill WHERE student_user_id = ?',
    [String(studentUserId)]
  );
  score += Math.min(25, skillRows[0].count * 5);

  return Math.min(100, score) / 100;
}

module.exports = {
  listInternships,
  getFeatured,
  getStats,
  getInternship,
  getEmployerProfile,
  // Shared scoring helpers (used by studentController for recommendations)
  computeSkillScore,
  computeProfileBonus,
  formatInternshipListItem,
  deriveIndustryFromMajor,
};
