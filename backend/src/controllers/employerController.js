const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { normalizeSkillName } = require('../utils/normalizeSkill');

const BCRYPT_SALT_ROUNDS = 12;
const uploadDir = process.env.UPLOAD_DIR || './uploads';

const VALID_INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Engineering', 'Other',
];

// ── GET /api/employer/profile ──────────────────────────────────────────────────
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

// ── PUT /api/employer/profile ──────────────────────────────────────────────────
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

  // Validate industry if provided
  if (req.body.industry && !VALID_INDUSTRIES.includes(req.body.industry)) {
    throw new AppError(`Industry must be one of: ${VALID_INDUSTRIES.join(', ')}`, 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update users table
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

    // Update employer table
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

// ── POST /api/employer/profile/picture ─────────────────────────────────────────
const uploadProfilePicture = catchAsync(async (req, res) => {
  const { userId } = req.user;
  if (!req.file) throw new AppError('No file uploaded', 400);

  const relativePath = `/uploads/profiles/${req.file.filename}`;

  // Get old picture for cleanup
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

// ── POST /api/employer/profile/logo ────────────────────────────────────────────
const uploadCompanyLogo = catchAsync(async (req, res) => {
  const { userId } = req.user;
  if (!req.file) throw new AppError('No file uploaded', 400);

  const relativePath = `/uploads/logos/${req.file.filename}`;

  // Get old logo for cleanup
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

// ── POST /api/employer/internships ─────────────────────────────────────────────
const createInternship = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const {
    title, description, location, workType, durationMonths,
    salaryMin, salaryMax, deadline, skills,
  } = req.body;

  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    throw new AppError('At least one skill is required', 400);
  }

  // Validate deadline is in the future if provided
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
        const normalizedName = normalizeSkillName(skill.skillName);
        const [existing] = await connection.execute(
          'SELECT skill_id FROM skill WHERE normalized_name = ?',
          [normalizedName]
        );
        if (existing.length > 0) {
          skillId = existing[0].skill_id;
        } else {
          const [inserted] = await connection.execute(
            'INSERT INTO skill (display_name, normalized_name, category) VALUES (?, ?, ?)',
            [skill.skillName, normalizedName, skill.category || 'other']
          );
          skillId = inserted.insertId;
        }
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

// ── GET /api/employer/internships ──────────────────────────────────────────────
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

// ── GET /api/employer/internships/:id ──────────────────────────────────────────
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

  // Get skills
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

// ── PUT /api/employer/internships/:id ──────────────────────────────────────────
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

    // Build dynamic update
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
          const normalizedName = normalizeSkillName(skill.skillName);
          const [existingSkill] = await connection.execute(
            'SELECT skill_id FROM skill WHERE normalized_name = ?',
            [normalizedName]
          );
          if (existingSkill.length > 0) {
            skillId = existingSkill[0].skill_id;
          } else {
            const [inserted] = await connection.execute(
              'INSERT INTO skill (display_name, normalized_name, category) VALUES (?, ?, ?)',
              [skill.skillName, normalizedName, skill.category || 'other']
            );
            skillId = inserted.insertId;
          }
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

// ── PUT /api/employer/internships/:id/resubmit ─────────────────────────────────
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

// ── PUT /api/employer/internships/:id/close ────────────────────────────────────
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

// ── PUT /api/employer/internships/:id/reopen ───────────────────────────────────
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

// ── DELETE /api/employer/internships/:id ────────────────────────────────────────
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

// ── GET /api/employer/internships/:id/applicants ───────────────────────────────
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

  // Count
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM application a ${whereClause}`,
    params
  );

  // Sort mapping
  const sortMap = {
    match_score: 'a.match_score DESC',
    applied_date: 'a.created_at DESC',
    status: 'a.status ASC',
  };
  const orderBy = sortMap[sort] || sortMap.match_score;

  const [rows] = await pool.execute(
    `SELECT a.application_id, a.student_user_id, a.status, a.match_score,
            a.cover_letter, a.submitted_resume_path, a.created_at,
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

  // Get top 5 skills for each applicant
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
      appliedDate: row.created_at,
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

// ── PUT /api/employer/applications/:id/status ──────────────────────────────────
const updateApplicationStatus = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { status, note } = req.body;

  // Valid transitions (state machine)
  const validTransitions = {
    pending: ['reviewing', 'rejected'],
    reviewing: ['shortlisted', 'rejected'],
    shortlisted: ['interview_scheduled', 'rejected'],
    interview_scheduled: ['accepted', 'rejected'],
    accepted: ['rejected'],
    rejected: [],
    withdrawn: [],
  };

  // Get current application with ownership check
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

    // Update application status
    await connection.execute(
      'UPDATE application SET status = ? WHERE application_id = ?',
      [status, id]
    );

    // Insert status history
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

// ── GET /api/employer/applications/:id/resume ──────────────────────────────────
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

// ── GET /api/employer/internships/:id/candidates ───────────────────────────────
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

  // Get internship required skills for scoring
  const [reqSkills] = await pool.execute(
    `SELECT rs.skill_id, rs.required_level, rs.is_mandatory
     FROM requires_skill rs WHERE rs.internship_id = ?`,
    [id]
  );

  if (reqSkills.length === 0) {
    return res.json({ success: true, data: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
  }

  // Get all active students
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
    // Get student skills
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
      // Check not already applied
      const [applied] = await pool.execute(
        'SELECT application_id FROM application WHERE internship_id = ? AND student_user_id = ?',
        [id, student.user_id]
      );

      // Get top 5 skills
      const [topSkills] = await pool.execute(
        `SELECT s.display_name, hs.proficiency_level
         FROM has_skill hs
         JOIN skill s ON s.skill_id = hs.skill_id
         WHERE hs.student_user_id = ?
         ORDER BY FIELD(hs.proficiency_level, 'advanced', 'intermediate', 'beginner')
         LIMIT 5`,
        [student.user_id]
      );

      // Check if already invited
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
        hasApplied: applied.length > 0,
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

// ── POST /api/employer/internships/:internshipId/invite/:studentId ─────────────
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

  // Check no existing invitation
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

// ── GET /api/employer/analytics ────────────────────────────────────────────────
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

// ── GET /api/employer/notifications ────────────────────────────────────────────
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

// ── PUT /api/employer/notifications/:id/read ───────────────────────────────────
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

// ── PUT /api/employer/notifications/read-all ───────────────────────────────────
const markAllNotificationsRead = catchAsync(async (req, res) => {
  const { userId } = req.user;

  await pool.execute(
    'UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

// ── PUT /api/employer/change-password ──────────────────────────────────────────
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

// ── GET /api/employer/notification-preferences ─────────────────────────────────
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

// ── PUT /api/employer/notification-preferences ─────────────────────────────────
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

// ── DELETE /api/employer/account ────────────────────────────────────────────────
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

  // Get logo for cleanup
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

// ── GET /api/employer/top-candidates ─────────────────────────────────────────────
const getTopCandidates = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { computeSkillScore, computeProfileBonus } = require('./internshipController');
  const embeddingService = require('../utils/embeddingService');

  // Get all active internships for this employer
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
  createInternship,
  getInternships,
  getInternship,
  updateInternship,
  resubmitInternship,
  closeInternship,
  reopenInternship,
  deleteInternship,
  getApplicants,
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
