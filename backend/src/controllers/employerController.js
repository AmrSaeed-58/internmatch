const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { normalizeSkillName } = require('../utils/normalizeSkill');
const { findOrCreateSkill } = require('../utils/skillResolver');

const BCRYPT_SALT_ROUNDS = 12;
const uploadDir = process.env.UPLOAD_DIR || './uploads';

const VALID_INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Engineering', 'Other',
];

const getProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [userRows] = await pool.execute(
    'SELECT user_id, full_name, email, profile_picture, created_at, updated_at FROM users WHERE user_id = ?',
    [userId]
  );
  if (userRows.length === 0) throw new AppError('User not found', 404);

  const [empRows] = await pool.execute(
    `SELECT company_name, industry, company_size, company_description, company_logo,
            website_url, linkedin_url, twitter_url, facebook_url, instagram_url, location
     FROM employer WHERE user_id = ?`,
    [userId]
  );
  if (empRows.length === 0) throw new AppError('Employer profile not found', 404);

  const u = userRows[0];
  const e = empRows[0];

  // Count active internships
  const [countRows] = await pool.execute(
    "SELECT COUNT(*) AS count FROM internship WHERE employer_user_id = ? AND status = 'active'",
    [userId]
  );

  res.json({
    success: true,
    data: {
      userId: u.user_id,
      fullName: u.full_name,
      email: u.email,
      profilePicture: u.profile_picture,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
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
      activeInternships: countRows[0].count,
    },
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;

  // Fields that go to users table
  const userFieldMap = { fullName: 'full_name' };
  // Fields that go to employer table
  const empFieldMap = {
    companyName: 'company_name',
    industry: 'industry',
    companySize: 'company_size',
    companyDescription: 'company_description',
    websiteUrl: 'website_url',
    linkedinUrl: 'linkedin_url',
    twitterUrl: 'twitter_url',
    facebookUrl: 'facebook_url',
    instagramUrl: 'instagram_url',
    location: 'location',
  };

  if (req.body.industry && !VALID_INDUSTRIES.includes(req.body.industry)) {
    throw new AppError(`Industry must be one of: ${VALID_INDUSTRIES.join(', ')}`, 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userFields = [];
    const userValues = [];
    for (const [key, col] of Object.entries(userFieldMap)) {
      if (req.body[key] !== undefined) {
        userFields.push(`${col} = ?`);
        userValues.push(req.body[key]);
      }
    }
    if (userFields.length > 0) {
      userValues.push(userId);
      await connection.execute(
        `UPDATE users SET ${userFields.join(', ')} WHERE user_id = ?`,
        userValues
      );
    }

    const empFields = [];
    const empValues = [];
    for (const [key, col] of Object.entries(empFieldMap)) {
      if (req.body[key] !== undefined) {
        empFields.push(`${col} = ?`);
        empValues.push(req.body[key]);
      }
    }
    if (empFields.length > 0) {
      empValues.push(userId);
      await connection.execute(
        `UPDATE employer SET ${empFields.join(', ')} WHERE user_id = ?`,
        empValues
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const uploadProfilePicture = catchAsync(async (req, res) => {
  const { userId } = req.user;
  if (!req.file) throw new AppError('No file uploaded', 400);

  const relativePath = `/uploads/profiles/${req.file.filename}`;

  const [old] = await pool.execute(
    'SELECT profile_picture FROM users WHERE user_id = ?',
    [userId]
  );

  await pool.execute(
    'UPDATE users SET profile_picture = ? WHERE user_id = ?',
    [relativePath, userId]
  );

  // Best-effort delete old
  if (old[0]?.profile_picture) {
    const oldFile = path.join(uploadDir, old[0].profile_picture.replace('/uploads/', ''));
    fs.unlink(oldFile, () => {});
  }

  res.json({
    success: true,
    data: { profilePicture: relativePath },
  });
});

const uploadCompanyLogo = catchAsync(async (req, res) => {
  const { userId } = req.user;
  if (!req.file) throw new AppError('No file uploaded', 400);

  const relativePath = `/uploads/logos/${req.file.filename}`;

  const [old] = await pool.execute(
    'SELECT company_logo FROM employer WHERE user_id = ?',
    [userId]
  );

  await pool.execute(
    'UPDATE employer SET company_logo = ? WHERE user_id = ?',
    [relativePath, userId]
  );

  // Best-effort delete old
  if (old[0]?.company_logo) {
    const oldFile = path.join(uploadDir, old[0].company_logo.replace('/uploads/', ''));
    fs.unlink(oldFile, () => {});
  }

  res.json({
    success: true,
    data: { companyLogo: relativePath },
  });
});

// Uses Gemini to extract required skills from a job description, cross-referenced
// with the skill table. Falls back to keyword matching if no API key is set or the
// LLM call fails.
const extractSkillsFromJobDescription = catchAsync(async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string' || description.trim().length < 30) {
    throw new AppError('Description must be at least 30 characters to extract skills', 400);
  }

  const text = description.trim();
  let extracted = [];
  let usedFallback = false;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_GENERATION_MODEL || 'gemini-2.5-flash-lite',
      });

      const prompt = `You are a hiring assistant. Read this internship job description and extract EVERY skill mentioned for the candidate — include both must-have skills AND nice-to-have / bonus / preferred skills. Do not omit optional skills.

Return a JSON array where each item has:
- "skill_name": canonical name (e.g. "Python", "React", "Figma", "Project Management")
- "category": one of: programming, web, data, ai_ml, devops, mobile, design, soft_skill, other
- "required_level": minimum proficiency the role needs — one of: beginner, intermediate, advanced (default to intermediate when unclear; use beginner for skills described as "familiarity" / "basic" / "exposure")
- "is_mandatory": true if the description marks it as required / must-have / required skill / "you should know"; false if it appears under nice-to-have / bonus / plus / preferred / "experience with X is a plus" / "familiarity with X" sections

Only return the JSON array, no prose, no markdown fences. Be precise — only list skills that are clearly named or strongly implied. Ignore generic phrases like "team player" unless they're a distinct soft skill. Aim to capture all named tools, languages, frameworks, and concepts even if they appear in the bonus / nice-to-have section.

Job description:
${text.substring(0, 4000)}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch {
        const match = response.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('Could not parse LLM response');
        parsed = JSON.parse(match[0]);
      }
      if (!Array.isArray(parsed)) throw new Error('LLM did not return an array');

      const validCategories = ['programming', 'web', 'data', 'ai_ml', 'devops', 'mobile', 'design', 'soft_skill', 'other'];
      const validLevels = ['beginner', 'intermediate', 'advanced'];

      const seen = new Set();
      for (const item of parsed) {
        if (!item || typeof item.skill_name !== 'string') continue;
        const skillName = item.skill_name.trim();
        if (!skillName) continue;

        const normalized = normalizeSkillName(skillName);
        if (seen.has(normalized)) continue;
        seen.add(normalized);

        const category = validCategories.includes(item.category) ? item.category : 'other';
        const requiredLevel = validLevels.includes(item.required_level) ? item.required_level : 'intermediate';
        const isMandatory = item.is_mandatory === false ? false : true;

        const [existing] = await pool.execute(
          'SELECT skill_id, display_name, category FROM skill WHERE normalized_name = ?',
          [normalized]
        );

        if (existing.length > 0) {
          extracted.push({
            skillId: existing[0].skill_id,
            displayName: existing[0].display_name,
            category: existing[0].category,
            requiredLevel,
            isMandatory,
            isCustom: false,
          });
        } else {
          extracted.push({
            skillId: null,
            displayName: skillName,
            category,
            requiredLevel,
            isMandatory,
            isCustom: true,
          });
        }
      }
    } catch (err) {
      console.error('LLM skill extraction failed, using fallback:', err.message);
      usedFallback = true;
    }
  } else {
    usedFallback = true;
  }

  // Keyword-match fallback against existing skill table
  if (usedFallback) {
    const [allSkills] = await pool.execute(
      'SELECT skill_id, display_name, category FROM skill'
    );
    const textLower = text.toLowerCase();
    const seen = new Set();
    for (const s of allSkills) {
      const escaped = s.display_name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(textLower) && !seen.has(s.skill_id)) {
        seen.add(s.skill_id);
        extracted.push({
          skillId: s.skill_id,
          displayName: s.display_name,
          category: s.category,
          requiredLevel: 'intermediate',
          isMandatory: true,
          isCustom: false,
        });
      }
    }
  }

  res.json({
    success: true,
    message: extracted.length > 0
      ? `Extracted ${extracted.length} skill${extracted.length === 1 ? '' : 's'} from the description`
      : 'No skills could be extracted — try adding more detail',
    data: {
      skills: extracted,
      method: usedFallback ? 'keyword_fallback' : 'llm',
    },
  });
});

const createInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const {
    title, description, location, workType, durationMonths,
    salaryMin, salaryMax, deadline, skills,
  } = req.body;

  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    throw new AppError('At least one skill is required', 400);
  }

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      throw new AppError('Deadline must be in the future', 400);
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO internship (employer_user_id, title, description, location, work_type,
        duration_months, salary_min, salary_max, status, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?)`,
      [
        userId, title, description, location, workType,
        durationMonths, salaryMin || null, salaryMax || null, deadline || null,
      ]
    );

    const internshipId = result.insertId;

    // Insert required/optional skills
    for (const skill of skills) {
      let skillId = skill.skillId;

      if (!skillId && skill.skillName) {
        const resolved = await findOrCreateSkill(connection, skill.skillName, skill.category || 'other');
        skillId = resolved.skillId;
      }

      if (skillId) {
        await connection.execute(
          `INSERT INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
           VALUES (?, ?, ?, ?)`,
          [internshipId, skillId, skill.requiredLevel || 'intermediate', skill.isMandatory !== false ? 1 : 0]
        );
      }
    }

    await connection.commit();

    // Notify admins about new internship pending review
    try {
      const [admins] = await pool.execute(
        "SELECT user_id FROM users WHERE role = 'admin' AND is_active = 1"
      );
      for (const admin of admins) {
        await pool.execute(
          `INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
           VALUES (?, 'internship_pending_review', ?, ?, ?, 'internship')`,
          [admin.user_id, 'New Internship Pending Review', `"${title}" needs approval`, internshipId]
        );
      }
    } catch (err) {
      console.error('Admin notification failed:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Internship posted — pending admin approval',
      data: { internshipId },
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const getInternships = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let whereClause = 'WHERE i.employer_user_id = ?';
  const params = [userId];

  if (status) {
    whereClause += ' AND i.status = ?';
    params.push(status);
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM internship i ${whereClause}`,
    params
  );

  const [rows] = await pool.execute(
    `SELECT i.internship_id, i.title, i.status, i.deadline, i.created_at, i.updated_at,
            i.work_type, i.location, i.admin_review_note,
            (SELECT COUNT(*) FROM application a WHERE a.internship_id = i.internship_id) AS applicant_count,
            (SELECT COUNT(*) FROM internship_view iv WHERE iv.internship_id = i.internship_id) AS view_count
     FROM internship i
     ${whereClause}
     ORDER BY i.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, String(limitNum), String(offset)]
  );

  res.json({
    success: true,
    data: rows.map((r) => ({
      internshipId: r.internship_id,
      title: r.title,
      status: r.status,
      deadline: r.deadline,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      workType: r.work_type,
      location: r.location,
      adminReviewNote: r.admin_review_note,
      applicantCount: r.applicant_count,
      viewCount: r.view_count,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limitNum),
    },
  });
});

const getInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const [rows] = await pool.execute(
    `SELECT i.internship_id, i.title, i.description, i.location, i.work_type,
            i.duration_months, i.salary_min, i.salary_max, i.status, i.admin_review_note,
            i.deadline, i.created_at, i.updated_at,
            (SELECT COUNT(*) FROM application a WHERE a.internship_id = i.internship_id) AS applicant_count,
            (SELECT COUNT(*) FROM internship_view iv WHERE iv.internship_id = i.internship_id) AS view_count
     FROM internship i
     WHERE i.internship_id = ? AND i.employer_user_id = ?`,
    [id, userId]
  );

  if (rows.length === 0) throw new AppError('Internship not found', 404);

  const internship = rows[0];

  const [skillRows] = await pool.execute(
    `SELECT rs.skill_id, s.display_name, s.normalized_name, s.category,
            rs.required_level, rs.is_mandatory
     FROM requires_skill rs
     JOIN skill s ON s.skill_id = rs.skill_id
     WHERE rs.internship_id = ?`,
    [id]
  );

  res.json({
    success: true,
    data: {
      internshipId: internship.internship_id,
      title: internship.title,
      description: internship.description,
      location: internship.location,
      workType: internship.work_type,
      durationMonths: internship.duration_months,
      salaryMin: internship.salary_min,
      salaryMax: internship.salary_max,
      status: internship.status,
      adminReviewNote: internship.admin_review_note,
      deadline: internship.deadline,
      createdAt: internship.created_at,
      updatedAt: internship.updated_at,
      applicantCount: internship.applicant_count,
      viewCount: internship.view_count,
      skills: skillRows.map((s) => ({
        skillId: s.skill_id,
        displayName: s.display_name,
        normalizedName: s.normalized_name,
        category: s.category,
        requiredLevel: s.required_level,
        isMandatory: !!s.is_mandatory,
      })),
    },
  });
});

const updateInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  // Verify ownership
  const [existing] = await pool.execute(
    'SELECT internship_id, status FROM internship WHERE internship_id = ? AND employer_user_id = ?',
    [id, userId]
  );
  if (existing.length === 0) throw new AppError('Internship not found', 404);

  const currentStatus = existing[0].status;
  if (currentStatus === 'closed') {
    throw new AppError('Cannot edit a closed internship. Reopen it first.', 400);
  }

  const {
    title, description, location, workType, durationMonths,
    salaryMin, salaryMax, deadline, skills,
  } = req.body;

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      throw new AppError('Deadline must be in the future', 400);
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const fields = [];
    const values = [];
    const fieldMap = {
      title: 'title',
      description: 'description',
      location: 'location',
      workType: 'work_type',
      durationMonths: 'duration_months',
      salaryMin: 'salary_min',
      salaryMax: 'salary_max',
      deadline: 'deadline',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(req.body[key] === '' ? null : req.body[key]);
      }
    }

    if (fields.length > 0) {
      values.push(id, userId);
      await connection.execute(
        `UPDATE internship SET ${fields.join(', ')} WHERE internship_id = ? AND employer_user_id = ?`,
        values
      );
    }

    // Replace skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      await connection.execute(
        'DELETE FROM requires_skill WHERE internship_id = ?',
        [id]
      );

      for (const skill of skills) {
        let skillId = skill.skillId;

        if (!skillId && skill.skillName) {
          const resolved = await findOrCreateSkill(connection, skill.skillName, skill.category || 'other');
          skillId = resolved.skillId;
        }

        if (skillId) {
          await connection.execute(
            `INSERT INTO requires_skill (internship_id, skill_id, required_level, is_mandatory)
             VALUES (?, ?, ?, ?)`,
            [id, skillId, skill.requiredLevel || 'intermediate', skill.isMandatory !== false ? 1 : 0]
          );
        }
      }
    }

    await connection.commit();

    // Fire-and-forget: regenerate internship embedding on edit
    const embeddingService = require('../utils/embeddingService');
    embeddingService.updateInternshipEmbedding(id).catch(() => {});

    res.json({ success: true, message: 'Internship updated successfully' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const resubmitInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const [rows] = await pool.execute(
    'SELECT internship_id, status FROM internship WHERE internship_id = ? AND employer_user_id = ?',
    [id, userId]
  );
  if (rows.length === 0) throw new AppError('Internship not found', 404);
  if (rows[0].status !== 'rejected') {
    throw new AppError('Only rejected internships can be resubmitted', 400);
  }

  await pool.execute(
    "UPDATE internship SET status = 'pending_approval', admin_review_note = NULL WHERE internship_id = ?",
    [id]
  );

  // Notify admins
  try {
    const [admins] = await pool.execute(
      "SELECT user_id FROM users WHERE role = 'admin' AND is_active = 1"
    );
    const [intern] = await pool.execute(
      'SELECT title FROM internship WHERE internship_id = ?',
      [id]
    );
    for (const admin of admins) {
      await pool.execute(
        `INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
         VALUES (?, 'internship_pending_review', ?, ?, ?, 'internship')`,
        [admin.user_id, 'Internship Resubmitted', `"${intern[0].title}" resubmitted for review`, id]
      );
    }
  } catch (err) {
    console.error('Admin notification failed:', err.message);
  }

  res.json({ success: true, message: 'Internship resubmitted for review' });
});

const closeInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const [rows] = await pool.execute(
    'SELECT internship_id, status FROM internship WHERE internship_id = ? AND employer_user_id = ?',
    [id, userId]
  );
  if (rows.length === 0) throw new AppError('Internship not found', 404);
  if (rows[0].status !== 'active') {
    throw new AppError('Only active internships can be closed', 400);
  }

  await pool.execute(
    "UPDATE internship SET status = 'closed' WHERE internship_id = ?",
    [id]
  );

  res.json({ success: true, message: 'Internship closed' });
});

const reopenInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const [rows] = await pool.execute(
    'SELECT internship_id, status, deadline FROM internship WHERE internship_id = ? AND employer_user_id = ?',
    [id, userId]
  );
  if (rows.length === 0) throw new AppError('Internship not found', 404);
  if (rows[0].status !== 'closed') {
    throw new AppError('Only closed internships can be reopened', 400);
  }

  // Check deadline hasn't passed
  if (rows[0].deadline && new Date(rows[0].deadline) <= new Date()) {
    throw new AppError('Cannot reopen — deadline has passed. Update the deadline first.', 400);
  }

  await pool.execute(
    "UPDATE internship SET status = 'active' WHERE internship_id = ?",
    [id]
  );

  // Fire-and-forget: regenerate internship embedding on reopen
  const embeddingService = require('../utils/embeddingService');
  embeddingService.updateInternshipEmbedding(id).catch(() => {});

  res.json({ success: true, message: 'Internship reopened' });
});

const deleteInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const [rows] = await pool.execute(
    'SELECT internship_id FROM internship WHERE internship_id = ? AND employer_user_id = ?',
    [id, userId]
  );
  if (rows.length === 0) throw new AppError('Internship not found', 404);

  // Cascade delete handles applications, required_skills, views, invitations
  // Conversations get internship_id set to NULL via ON DELETE SET NULL
  await pool.execute(
    'DELETE FROM internship WHERE internship_id = ? AND employer_user_id = ?',
    [id, userId]
  );

  res.json({ success: true, message: 'Internship deleted permanently' });
});

const getApplicants = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { status, sort = 'match_score', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Verify ownership
  const [ownership] = await pool.execute(
    'SELECT internship_id FROM internship WHERE internship_id = ? AND employer_user_id = ?',
    [id, userId]
  );
  if (ownership.length === 0) throw new AppError('Internship not found', 404);

  let whereClause = 'WHERE a.internship_id = ?';
  const params = [id];

  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM application a ${whereClause}`,
    params
  );

  // Sort mapping. Frontend sends camelCase values from ViewApplicants.jsx
  // (matchScore, appliedDate, gpa, status) — accept those plus snake_case.
  const sortMap = {
    matchScore: 'a.match_score DESC',
    match_score: 'a.match_score DESC',
    appliedDate: 'a.applied_date DESC',
    applied_date: 'a.applied_date DESC',
    gpa: 's.gpa DESC',
    status: 'a.status ASC',
  };
  const orderBy = sortMap[sort] || sortMap.matchScore;

  const [rows] = await pool.execute(
    `SELECT a.application_id, a.student_user_id, a.status, a.match_score,
            a.cover_letter, a.submitted_resume_path, a.applied_date,
            u.full_name, u.email, u.profile_picture,
            s.university, s.major, s.gpa, s.graduation_year
     FROM application a
     JOIN users u ON u.user_id = a.student_user_id
     JOIN student s ON s.user_id = a.student_user_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, String(limitNum), String(offset)]
  );

  const applicants = [];
  for (const row of rows) {
    const [skillRows] = await pool.execute(
      `SELECT s.display_name, hs.proficiency_level
       FROM has_skill hs
       JOIN skill s ON s.skill_id = hs.skill_id
       WHERE hs.student_user_id = ?
       ORDER BY FIELD(hs.proficiency_level, 'advanced', 'intermediate', 'beginner')
       LIMIT 5`,
      [row.student_user_id]
    );

    const currentYear = new Date().getFullYear();
    applicants.push({
      applicationId: row.application_id,
      studentUserId: row.student_user_id,
      status: row.status,
      matchScore: row.match_score,
      coverLetter: row.cover_letter,
      hasResume: !!row.submitted_resume_path,
      appliedDate: row.applied_date,
      fullName: row.full_name,
      email: row.email,
      profilePicture: row.profile_picture,
      university: row.university,
      major: row.major,
      gpa: row.gpa,
      graduationYear: row.graduation_year,
      graduationStatus: row.graduation_year < currentYear ? 'graduated' : 'enrolled',
      skills: skillRows.map((sk) => ({
        displayName: sk.display_name,
        proficiencyLevel: sk.proficiency_level,
      })),
    });
  }

  res.json({
    success: true,
    data: applicants,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limitNum),
    },
  });
});

// Returns a student's profile so the employer can review them. Access is
// granted only if the student has applied to one of this employer's
// internships, or has been invited by this employer.
const getApplicantProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { studentId } = req.params;

  const [access] = await pool.execute(
    `SELECT 1 FROM application a
       JOIN internship i ON i.internship_id = a.internship_id
       WHERE a.student_user_id = ? AND i.employer_user_id = ?
     UNION
     SELECT 1 FROM internship_invitation inv
       WHERE inv.student_user_id = ? AND inv.employer_user_id = ?
     LIMIT 1`,
    [studentId, userId, studentId, userId]
  );
  if (access.length === 0) {
    throw new AppError('You do not have access to this student profile', 403);
  }

  const [userRows] = await pool.execute(
    `SELECT user_id, full_name, email, profile_picture, created_at
     FROM users WHERE user_id = ? AND role = 'student' AND is_active = 1`,
    [studentId]
  );
  if (userRows.length === 0) throw new AppError('Student not found', 404);

  const [studentRows] = await pool.execute(
    `SELECT major, university, university_start_date, graduation_year, gpa, bio,
            location, linkedin_url, github_url, instagram_url, phone, primary_resume_id
     FROM student WHERE user_id = ?`,
    [studentId]
  );
  if (studentRows.length === 0) throw new AppError('Student profile not found', 404);

  const [skillRows] = await pool.execute(
    `SELECT s.skill_id, s.display_name, s.category, hs.proficiency_level
     FROM has_skill hs
     JOIN skill s ON s.skill_id = hs.skill_id
     WHERE hs.student_user_id = ?
     ORDER BY FIELD(hs.proficiency_level, 'advanced', 'intermediate', 'beginner'), s.display_name`,
    [studentId]
  );

  const [appRows] = await pool.execute(
    `SELECT a.application_id, a.internship_id, a.status, a.match_score,
            a.cover_letter, a.applied_date, a.submitted_resume_path,
            i.title AS internship_title
     FROM application a
     JOIN internship i ON i.internship_id = a.internship_id
     WHERE a.student_user_id = ? AND i.employer_user_id = ?
     ORDER BY a.applied_date DESC`,
    [studentId, userId]
  );

  const u = userRows[0];
  const s = studentRows[0];
  const currentYear = new Date().getFullYear();

  res.json({
    success: true,
    data: {
      userId: u.user_id,
      fullName: u.full_name,
      email: u.email,
      profilePicture: u.profile_picture,
      memberSince: u.created_at,
      major: s.major,
      university: s.university,
      universityStartDate: s.university_start_date,
      graduationYear: s.graduation_year,
      graduationStatus: s.graduation_year && s.graduation_year < currentYear ? 'graduated' : 'enrolled',
      gpa: s.gpa,
      bio: s.bio,
      location: s.location,
      linkedinUrl: s.linkedin_url,
      githubUrl: s.github_url,
      instagramUrl: s.instagram_url,
      phone: s.phone,
      hasPrimaryResume: !!s.primary_resume_id,
      skills: skillRows.map((sk) => ({
        skillId: sk.skill_id,
        displayName: sk.display_name,
        category: sk.category,
        proficiencyLevel: sk.proficiency_level,
      })),
      applications: appRows.map((a) => ({
        applicationId: a.application_id,
        internshipId: a.internship_id,
        internshipTitle: a.internship_title,
        status: a.status,
        matchScore: a.match_score,
        coverLetter: a.cover_letter,
        appliedDate: a.applied_date,
        hasResume: !!a.submitted_resume_path,
      })),
    },
  });
});

const updateApplicationStatus = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { status, note } = req.body;

  // Valid transitions (state machine). Status names MUST match the enum
  // declared on `application.status` in Schema.sql.
  const validTransitions = {
    pending: ['under_review', 'rejected'],
    under_review: ['interview_scheduled', 'rejected'],
    interview_scheduled: ['accepted', 'rejected'],
    accepted: ['rejected'],
    rejected: [],
    withdrawn: [],
  };

  const [appRows] = await pool.execute(
    `SELECT a.application_id, a.status, a.student_user_id, a.internship_id,
            i.title AS internship_title
     FROM application a
     JOIN internship i ON i.internship_id = a.internship_id
     WHERE a.application_id = ? AND i.employer_user_id = ?`,
    [id, userId]
  );

  if (appRows.length === 0) throw new AppError('Application not found', 404);

  const app = appRows[0];
  const currentStatus = app.status;

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
    throw new AppError(
      `Cannot change status from "${currentStatus}" to "${status}". Valid transitions: ${(validTransitions[currentStatus] || []).join(', ') || 'none'}`,
      400
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      'UPDATE application SET status = ?, status_updated_at = NOW() WHERE application_id = ?',
      [status, id]
    );

    await connection.execute(
      `INSERT INTO application_status_history (application_id, old_status, new_status, changed_by_user_id, note)
       VALUES (?, ?, ?, ?, ?)`,
      [id, currentStatus, status, userId, note || null]
    );

    // Notify student
    await connection.execute(
      `INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
       VALUES (?, 'application_status_change', ?, ?, ?, 'application')`,
      [
        app.student_user_id,
        'Application Status Updated',
        `Your application for "${app.internship_title}" has been updated to: ${status.replace(/_/g, ' ')}`,
        id,
      ]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  res.json({ success: true, message: `Application status updated to ${status}` });
});

const downloadResume = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const [rows] = await pool.execute(
    `SELECT a.submitted_resume_path, a.submitted_resume_filename
     FROM application a
     JOIN internship i ON i.internship_id = a.internship_id
     WHERE a.application_id = ? AND i.employer_user_id = ?`,
    [id, userId]
  );

  if (rows.length === 0) throw new AppError('Application not found', 404);
  if (!rows[0].submitted_resume_path) throw new AppError('No resume submitted with this application', 404);

  const filePath = path.join(uploadDir, rows[0].submitted_resume_path.replace('/uploads/', ''));
  if (!fs.existsSync(filePath)) throw new AppError('Resume file not found', 404);

  res.download(filePath, rows[0].submitted_resume_filename || 'resume');
});

const getCandidates = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { minScore = 0, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Verify ownership and active status
  const [ownership] = await pool.execute(
    "SELECT internship_id FROM internship WHERE internship_id = ? AND employer_user_id = ? AND status = 'active'",
    [id, userId]
  );
  if (ownership.length === 0) {
    throw new AppError('Internship not found or not active', 404);
  }

  const [reqSkills] = await pool.execute(
    `SELECT rs.skill_id, rs.required_level, rs.is_mandatory
     FROM requires_skill rs WHERE rs.internship_id = ?`,
    [id]
  );

  if (reqSkills.length === 0) {
    return res.json({ success: true, data: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
  }

  const [students] = await pool.execute(
    `SELECT s.user_id, u.full_name, u.email, u.profile_picture,
            s.university, s.major, s.gpa, s.graduation_year
     FROM student s
     JOIN users u ON u.user_id = s.user_id
     WHERE u.is_active = 1`
  );

  // Import unified scoring helpers
  const { computeSkillScore, computeProfileBonus } = require('./internshipController');
  const embeddingService = require('../utils/embeddingService');

  // Format required skills for computeSkillScore
  const formattedReqSkills = reqSkills.map((rs) => ({
    skillId: rs.skill_id,
    requiredLevel: rs.required_level,
    isMandatory: !!rs.is_mandatory,
  }));

  // Score each student
  const candidates = [];
  const currentYear = new Date().getFullYear();

  for (const student of students) {
    const [studentSkills] = await pool.execute(
      `SELECT hs.skill_id, hs.proficiency_level
       FROM has_skill hs WHERE hs.student_user_id = ?`,
      [student.user_id]
    );

    const studentSkillMap = {};
    for (const sk of studentSkills) {
      studentSkillMap[sk.skill_id] = sk.proficiency_level;
    }

    // Use unified scoring
    const skillScore = computeSkillScore(formattedReqSkills, studentSkillMap);
    const profileBonus = await computeProfileBonus(student.user_id);
    const semanticScore = await embeddingService.computeSemanticScore(student.user_id, id);

    let finalScore;
    if (semanticScore !== null) {
      finalScore = Math.round(skillScore * 0.65 + semanticScore * 0.20 + profileBonus * 100 * 0.15);
    } else {
      finalScore = Math.round(skillScore * 0.80 + profileBonus * 100 * 0.20);
    }

    if (finalScore >= parseFloat(minScore)) {
      // Skip students who have already applied — they're tracked through the
      // applicants page, so showing them as "candidates" is just noise.
      const [applied] = await pool.execute(
        'SELECT application_id FROM application WHERE internship_id = ? AND student_user_id = ?',
        [id, student.user_id]
      );
      if (applied.length > 0) continue;

      const [topSkills] = await pool.execute(
        `SELECT s.display_name, hs.proficiency_level
         FROM has_skill hs
         JOIN skill s ON s.skill_id = hs.skill_id
         WHERE hs.student_user_id = ?
         ORDER BY FIELD(hs.proficiency_level, 'advanced', 'intermediate', 'beginner')
         LIMIT 5`,
        [student.user_id]
      );

      const [invited] = await pool.execute(
        'SELECT invitation_id FROM internship_invitation WHERE internship_id = ? AND student_user_id = ?',
        [id, student.user_id]
      );

      candidates.push({
        studentUserId: student.user_id,
        fullName: student.full_name,
        email: student.email,
        profilePicture: student.profile_picture,
        university: student.university,
        major: student.major,
        gpa: student.gpa,
        graduationYear: student.graduation_year,
        graduationStatus: student.graduation_year < currentYear ? 'graduated' : 'enrolled',
        matchScore: finalScore,
        hasApplied: false,
        isInvited: invited.length > 0,
        skills: topSkills.map((sk) => ({
          displayName: sk.display_name,
          proficiencyLevel: sk.proficiency_level,
        })),
      });
    }
  }

  // Sort by match score desc
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  const total = candidates.length;
  const paged = candidates.slice(offset, offset + limitNum);

  res.json({
    success: true,
    data: paged,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

const inviteStudent = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { internshipId, studentId } = req.params;
  const { message } = req.body;

  // Verify ownership and active
  const [ownership] = await pool.execute(
    "SELECT internship_id, title FROM internship WHERE internship_id = ? AND employer_user_id = ? AND status = 'active'",
    [internshipId, userId]
  );
  if (ownership.length === 0) throw new AppError('Internship not found or not active', 404);

  // Verify student exists and is active
  const [studentRows] = await pool.execute(
    "SELECT user_id FROM users WHERE user_id = ? AND role = 'student' AND is_active = 1",
    [studentId]
  );
  if (studentRows.length === 0) throw new AppError('Student not found', 404);

  const [existing] = await pool.execute(
    'SELECT invitation_id FROM internship_invitation WHERE internship_id = ? AND student_user_id = ?',
    [internshipId, studentId]
  );
  if (existing.length > 0) throw new AppError('Student has already been invited', 400);

  await pool.execute(
    `INSERT INTO internship_invitation (internship_id, student_user_id, employer_user_id, message)
     VALUES (?, ?, ?, ?)`,
    [internshipId, studentId, userId, message || null]
  );

  // Notify student
  await pool.execute(
    `INSERT INTO notification (user_id, type, title, message, reference_id, reference_type)
     VALUES (?, 'invitation_received', ?, ?, ?, 'internship')`,
    [
      studentId,
      'Invitation to Apply',
      `You've been invited to apply for "${ownership[0].title}"`,
      internshipId,
    ]
  );

  res.status(201).json({ success: true, message: 'Invitation sent' });
});

const getAnalytics = catchAsync(async (req, res) => {
  const { userId } = req.user;

  // Per-internship stats
  const [internships] = await pool.execute(
    `SELECT i.internship_id, i.title, i.status, i.created_at,
            (SELECT COUNT(*) FROM application a WHERE a.internship_id = i.internship_id) AS applicant_count,
            (SELECT COUNT(*) FROM internship_view iv WHERE iv.internship_id = i.internship_id) AS view_count,
            (SELECT COUNT(*) FROM application a WHERE a.internship_id = i.internship_id AND a.status = 'accepted') AS accepted_count,
            (SELECT AVG(a.match_score) FROM application a WHERE a.internship_id = i.internship_id) AS avg_match_score
     FROM internship i
     WHERE i.employer_user_id = ?
     ORDER BY i.created_at DESC`,
    [userId]
  );

  // Status distribution across all applications
  const [statusDist] = await pool.execute(
    `SELECT a.status, COUNT(*) AS count
     FROM application a
     JOIN internship i ON i.internship_id = a.internship_id
     WHERE i.employer_user_id = ?
     GROUP BY a.status`,
    [userId]
  );

  // Overall totals
  const [totals] = await pool.execute(
    `SELECT
       COUNT(DISTINCT a.application_id) AS total_applicants,
       AVG(a.match_score) AS avg_match_score,
       SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) AS total_accepted
     FROM application a
     JOIN internship i ON i.internship_id = a.internship_id
     WHERE i.employer_user_id = ?`,
    [userId]
  );

  // Views over time (weekly for last 12 weeks)
  const [viewsTrend] = await pool.execute(
    `SELECT
       DATE_FORMAT(iv.viewed_at, '%Y-%u') AS week,
       MIN(DATE(iv.viewed_at)) AS week_start,
       COUNT(*) AS views
     FROM internship_view iv
     JOIN internship i ON i.internship_id = iv.internship_id
     WHERE i.employer_user_id = ? AND iv.viewed_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
     GROUP BY week
     ORDER BY week`,
    [userId]
  );

  const t = totals[0];
  const conversionRate = t.total_applicants > 0
    ? Math.round((t.total_accepted / t.total_applicants) * 10000) / 100
    : 0;

  res.json({
    success: true,
    data: {
      internships: internships.map((i) => ({
        internshipId: i.internship_id,
        title: i.title,
        status: i.status,
        applicantCount: i.applicant_count,
        viewCount: i.view_count,
        acceptedCount: i.accepted_count,
        avgMatchScore: i.avg_match_score ? Math.round(parseFloat(i.avg_match_score)) : null,
      })),
      statusDistribution: statusDist.map((s) => ({
        status: s.status,
        count: s.count,
      })),
      overall: {
        totalApplicants: t.total_applicants,
        avgMatchScore: t.avg_match_score ? Math.round(parseFloat(t.avg_match_score)) : null,
        totalAccepted: t.total_accepted,
        conversionRate,
      },
      viewsTrend: viewsTrend.map((v) => ({
        week: v.week_start,
        views: v.views,
      })),
    },
  });
});

const getNotifications = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { page = 1, limit = 20, unread } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let whereClause = 'WHERE user_id = ?';
  const params = [userId];

  if (unread === 'true') {
    whereClause += ' AND is_read = 0';
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM notification ${whereClause}`,
    params
  );

  const [rows] = await pool.execute(
    `SELECT notification_id, type, title, message, reference_id, reference_type,
            is_read, created_at
     FROM notification
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, String(limitNum), String(offset)]
  );

  res.json({
    success: true,
    data: rows.map((r) => ({
      notificationId: r.notification_id,
      type: r.type,
      title: r.title,
      message: r.message,
      referenceId: r.reference_id,
      referenceType: r.reference_type,
      isRead: !!r.is_read,
      createdAt: r.created_at,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limitNum),
    },
  });
});

const markNotificationRead = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const [result] = await pool.execute(
    'UPDATE notification SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
    [id, userId]
  );

  if (result.affectedRows === 0) throw new AppError('Notification not found', 404);

  res.json({ success: true, message: 'Notification marked as read' });
});

const markAllNotificationsRead = catchAsync(async (req, res) => {
  const { userId } = req.user;

  await pool.execute(
    'UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

const changePassword = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  const [rows] = await pool.execute(
    'SELECT password FROM users WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(currentPassword, rows[0].password);
  if (!match) throw new AppError('Current password is incorrect', 401);

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await pool.execute(
    'UPDATE users SET password = ?, token_version = token_version + 1 WHERE user_id = ?',
    [hashedPassword, userId]
  );

  try {
    await pool.execute(
      'INSERT INTO system_log (user_id, action, ip_address) VALUES (?, ?, ?)',
      [userId, 'password_changed', req.ip]
    );
  } catch (err) {
    console.error('System log failed:', err.message);
  }

  res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
});

const getNotificationPreferences = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [rows] = await pool.execute(
    `SELECT email_new_application, email_internship_approved, email_new_message
     FROM notification_preference WHERE user_id = ?`,
    [userId]
  );

  if (rows.length === 0) throw new AppError('Preferences not found', 404);

  res.json({
    success: true,
    data: {
      emailNewApplication: !!rows[0].email_new_application,
      emailInternshipApproved: !!rows[0].email_internship_approved,
      emailNewMessage: !!rows[0].email_new_message,
    },
  });
});

const updateNotificationPreferences = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { emailNewApplication, emailInternshipApproved, emailNewMessage } = req.body;

  const fields = [];
  const values = [];

  if (emailNewApplication !== undefined) { fields.push('email_new_application = ?'); values.push(emailNewApplication ? 1 : 0); }
  if (emailInternshipApproved !== undefined) { fields.push('email_internship_approved = ?'); values.push(emailInternshipApproved ? 1 : 0); }
  if (emailNewMessage !== undefined) { fields.push('email_new_message = ?'); values.push(emailNewMessage ? 1 : 0); }

  if (fields.length === 0) throw new AppError('No preferences to update', 400);

  values.push(userId);
  await pool.execute(
    `UPDATE notification_preference SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );

  res.json({ success: true, message: 'Notification preferences updated' });
});

const deleteAccount = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { password } = req.body;

  if (!password) throw new AppError('Password confirmation required', 400);

  const [rows] = await pool.execute(
    'SELECT password, profile_picture FROM users WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match) throw new AppError('Incorrect password', 401);

  const [empRows] = await pool.execute(
    'SELECT company_logo FROM employer WHERE user_id = ?',
    [userId]
  );

  // Delete user (cascades to employer, internships, applications, etc.)
  await pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);

  // Best-effort file cleanup
  if (rows[0].profile_picture) {
    const picFile = path.join(uploadDir, rows[0].profile_picture.replace('/uploads/', ''));
    fs.unlink(picFile, () => {});
  }
  if (empRows[0]?.company_logo) {
    const logoFile = path.join(uploadDir, empRows[0].company_logo.replace('/uploads/', ''));
    fs.unlink(logoFile, () => {});
  }

  res.json({ success: true, message: 'Account deleted permanently' });
});

const getTopCandidates = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { computeSkillScore, computeProfileBonus } = require('./internshipController');
  const embeddingService = require('../utils/embeddingService');

  const [internships] = await pool.execute(
    "SELECT internship_id, title FROM internship WHERE employer_user_id = ? AND status = 'active'",
    [userId]
  );

  if (internships.length === 0) {
    return res.json({ success: true, data: [] });
  }

  // Get required skills for all active internships
  const iIds = internships.map((i) => i.internship_id);
  const placeholders = iIds.map(() => '?').join(',');
  const [allReqSkills] = await pool.execute(
    `SELECT rs.internship_id, rs.skill_id, rs.required_level, rs.is_mandatory
     FROM requires_skill rs WHERE rs.internship_id IN (${placeholders})`,
    iIds.map(String)
  );

  const reqSkillsByInternship = {};
  for (const rs of allReqSkills) {
    if (!reqSkillsByInternship[rs.internship_id]) reqSkillsByInternship[rs.internship_id] = [];
    reqSkillsByInternship[rs.internship_id].push({
      skillId: rs.skill_id,
      requiredLevel: rs.required_level,
      isMandatory: !!rs.is_mandatory,
    });
  }

  // Get all active students (limit to avoid performance issues)
  const [students] = await pool.execute(
    `SELECT s.user_id, u.full_name, u.profile_picture, s.university, s.major, s.gpa
     FROM student s
     JOIN users u ON u.user_id = s.user_id
     WHERE u.is_active = 1
     LIMIT 100`
  );

  // Pre-load all applications by these students to this employer's internships
  // so we can skip (student, internship) pairs they've already applied to.
  const studentIds = students.map((s) => s.user_id);
  const appliedSet = new Set(); // "studentId:internshipId"
  if (studentIds.length > 0) {
    const studentPlaceholders = studentIds.map(() => '?').join(',');
    const [appliedRows] = await pool.execute(
      `SELECT student_user_id, internship_id FROM application
       WHERE internship_id IN (${placeholders}) AND student_user_id IN (${studentPlaceholders})`,
      [...iIds.map(String), ...studentIds.map(String)]
    );
    for (const r of appliedRows) {
      appliedSet.add(`${r.student_user_id}:${r.internship_id}`);
    }
  }

  // Find best match per student across all internships
  const candidateMap = {};
  for (const student of students) {
    const [studentSkills] = await pool.execute(
      'SELECT skill_id, proficiency_level FROM has_skill WHERE student_user_id = ?',
      [student.user_id]
    );
    const studentSkillMap = {};
    for (const sk of studentSkills) {
      studentSkillMap[sk.skill_id] = sk.proficiency_level;
    }

    const profileBonus = await computeProfileBonus(student.user_id);

    for (const intern of internships) {
      // Skip pairs where the student has already applied — they belong on
      // the applicants page, not the recommendations strip.
      if (appliedSet.has(`${student.user_id}:${intern.internship_id}`)) continue;

      const reqSkills = reqSkillsByInternship[intern.internship_id];
      if (!reqSkills || reqSkills.length === 0) continue;

      const skillScore = computeSkillScore(reqSkills, studentSkillMap);
      const semanticScore = await embeddingService.computeSemanticScore(student.user_id, intern.internship_id);

      let score;
      if (semanticScore !== null) {
        score = Math.round(skillScore * 0.65 + semanticScore * 0.20 + profileBonus * 100 * 0.15);
      } else {
        score = Math.round(skillScore * 0.80 + profileBonus * 100 * 0.20);
      }

      // Keep best match per student
      if (!candidateMap[student.user_id] || candidateMap[student.user_id].matchScore < score) {
        candidateMap[student.user_id] = {
          studentUserId: student.user_id,
          fullName: student.full_name,
          profilePicture: student.profile_picture,
          university: student.university,
          major: student.major,
          gpa: student.gpa,
          matchedInternship: intern.title,
          matchedInternshipId: intern.internship_id,
          matchScore: score,
        };
      }
    }
  }

  // Sort by score, return top 5
  const top = Object.values(candidateMap)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  res.json({ success: true, data: top });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadCompanyLogo,
  extractSkillsFromJobDescription,
  createInternship,
  getInternships,
  getInternship,
  updateInternship,
  resubmitInternship,
  closeInternship,
  reopenInternship,
  deleteInternship,
  getApplicants,
  getApplicantProfile,
  updateApplicationStatus,
  downloadResume,
  getCandidates,
  inviteStudent,
  getTopCandidates,
  getAnalytics,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  deleteAccount,
};
