const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const embeddingService = require('../utils/embeddingService');
const { findOrCreateSkill } = require('../utils/skillResolver');

const BCRYPT_SALT_ROUNDS = 12;
const uploadDir = process.env.UPLOAD_DIR || './uploads';

const getProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [userRows] = await pool.execute(
    'SELECT user_id, full_name, email, profile_picture, created_at, updated_at FROM users WHERE user_id = ?',
    [userId]
  );
  if (userRows.length === 0) throw new AppError('User not found', 404);

  const [studentRows] = await pool.execute(
    `SELECT major, university, university_start_date, graduation_year, gpa, bio,
            gender, date_of_birth, location,
            linkedin_url, github_url, instagram_url, phone, primary_resume_id
     FROM student WHERE user_id = ?`,
    [userId]
  );
  if (studentRows.length === 0) throw new AppError('Student profile not found', 404);

  const u = userRows[0];
  const s = studentRows[0];
  const currentYear = new Date().getFullYear();

  const [skillCount] = await pool.execute(
    'SELECT COUNT(*) AS count FROM has_skill WHERE student_user_id = ?',
    [userId]
  );

  let resume = null;
  if (s.primary_resume_id) {
    const [resumeRows] = await pool.execute(
      'SELECT resume_id, original_filename, file_type, created_at FROM resume WHERE resume_id = ? AND student_user_id = ?',
      [s.primary_resume_id, userId]
    );
    if (resumeRows.length > 0) {
      resume = {
        resumeId: resumeRows[0].resume_id,
        originalFilename: resumeRows[0].original_filename,
        fileType: resumeRows[0].file_type,
        createdAt: resumeRows[0].created_at,
      };
    }
  }

  res.json({
    success: true,
    data: {
      userId: u.user_id,
      fullName: u.full_name,
      email: u.email,
      profilePicture: u.profile_picture,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      major: s.major,
      university: s.university,
      universityStartDate: s.university_start_date,
      graduationYear: s.graduation_year,
      graduationStatus: s.graduation_year < currentYear ? 'graduated' : 'enrolled',
      gpa: s.gpa,
      bio: s.bio,
      gender: s.gender,
      dateOfBirth: s.date_of_birth,
      location: s.location,
      linkedinUrl: s.linkedin_url,
      githubUrl: s.github_url,
      instagramUrl: s.instagram_url,
      phone: s.phone,
      primaryResumeId: s.primary_resume_id,
      resume,
      skillCount: skillCount[0].count,
    },
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const {
    fullName, major, university, universityStartDate, graduationYear,
    gpa, bio, linkedinUrl, githubUrl, instagramUrl, phone,
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (fullName !== undefined) {
      await connection.execute(
        'UPDATE users SET full_name = ? WHERE user_id = ?',
        [fullName, userId]
      );
    }

    const studentFields = [];
    const studentValues = [];

    const fieldMap = {
      major: 'major',
      university: 'university',
      universityStartDate: 'university_start_date',
      graduationYear: 'graduation_year',
      gpa: 'gpa',
      bio: 'bio',
      gender: 'gender',
      dateOfBirth: 'date_of_birth',
      location: 'location',
      linkedinUrl: 'linkedin_url',
      githubUrl: 'github_url',
      instagramUrl: 'instagram_url',
      phone: 'phone',
    };

    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      const value = req.body[jsKey];
      if (value !== undefined) {
        studentFields.push(`${dbCol} = ?`);
        studentValues.push(value === '' ? null : value);
      }
    }

    if (studentFields.length > 0) {
      studentValues.push(userId);
      await connection.execute(
        `UPDATE student SET ${studentFields.join(', ')} WHERE user_id = ?`,
        studentValues
      );
    }

    await connection.commit();

    // Fire-and-forget: regenerate student embedding on profile change
    embeddingService.updateStudentEmbedding(userId).catch(() => {});

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

  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  const filePath = `/uploads/profiles/${req.file.filename}`;

  const [oldRows] = await pool.execute(
    'SELECT profile_picture FROM users WHERE user_id = ?',
    [userId]
  );

  await pool.execute(
    'UPDATE users SET profile_picture = ? WHERE user_id = ?',
    [filePath, userId]
  );

  // Best-effort delete old file
  if (oldRows[0]?.profile_picture) {
    const oldFile = path.join(uploadDir, oldRows[0].profile_picture.replace('/uploads/', ''));
    fs.unlink(oldFile, () => {});
  }

  res.json({
    success: true,
    message: 'Profile picture updated',
    data: { profilePicture: filePath },
  });
});

const deleteProfilePicture = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [rows] = await pool.execute(
    'SELECT profile_picture FROM users WHERE user_id = ?',
    [userId]
  );

  if (!rows[0]?.profile_picture) {
    throw new AppError('No profile picture to delete', 404);
  }

  await pool.execute(
    'UPDATE users SET profile_picture = NULL WHERE user_id = ?',
    [userId]
  );

  // Best-effort delete file
  const oldFile = path.join(uploadDir, rows[0].profile_picture.replace('/uploads/', ''));
  fs.unlink(oldFile, () => {});

  res.json({ success: true, message: 'Profile picture removed' });
});

const uploadResume = catchAsync(async (req, res) => {
  const { userId } = req.user;

  if (!req.file) {
    throw new AppError('No resume file provided', 400);
  }

  const filePath = `/uploads/resumes/${req.file.filename}`;
  const originalFilename = req.file.originalname;
  const ext = path.extname(originalFilename).toLowerCase().replace('.', '');
  const fileType = ext === 'pdf' ? 'pdf' : 'docx';

  let extractedText = '';
  const fullPath = path.resolve(uploadDir, 'resumes', req.file.filename);

  try {
    if (fileType === 'pdf') {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(fullPath);
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
    } else {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: fullPath });
      extractedText = result.value || '';
    }
  } catch (err) {
    console.error('Text extraction failed:', err.message);
  }

  // LLM skill extraction (or fallback)
  let extractedSkills = [];
  try {
    extractedSkills = await extractSkillsFromText(extractedText);
  } catch (err) {
    console.error('Skill extraction failed, using fallback:', err.message);
    extractedSkills = await fallbackSkillExtraction(extractedText);
  }

  // Store staging info in a simple way — save file info but don't commit to DB yet
  // We'll store the staging data in the response for the frontend to send back on confirm
  res.json({
    success: true,
    message: 'Resume uploaded and analyzed. Review extracted skills before confirming.',
    data: {
      staging: {
        filePath,
        originalFilename,
        fileType,
        extractedText,
        extractedTextPreview: extractedText.substring(0, 500),
      },
      extractedSkills,
    },
  });
});

const confirmResume = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { staging, skills } = req.body;

  if (!staging || !staging.filePath) {
    throw new AppError('No staged resume to confirm', 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [oldResume] = await connection.execute(
      'SELECT resume_id, file_path FROM resume WHERE student_user_id = ?',
      [userId]
    );

    // Clear primary_resume_id
    await connection.execute(
      'UPDATE student SET primary_resume_id = NULL WHERE user_id = ?',
      [userId]
    );

    // Null out application.resume_id for old applications
    if (oldResume.length > 0) {
      await connection.execute(
        'UPDATE application SET resume_id = NULL WHERE resume_id = ?',
        [oldResume[0].resume_id]
      );
      await connection.execute(
        'DELETE FROM resume WHERE resume_id = ?',
        [oldResume[0].resume_id]
      );
    }

    const [insertResult] = await connection.execute(
      'INSERT INTO resume (student_user_id, file_path, original_filename, file_type, extracted_text) VALUES (?, ?, ?, ?, ?)',
      [userId, staging.filePath, staging.originalFilename, staging.fileType, staging.extractedText || null]
    );
    const newResumeId = insertResult.insertId;

    // Set as primary
    await connection.execute(
      'UPDATE student SET primary_resume_id = ? WHERE user_id = ?',
      [newResumeId, userId]
    );

    // Save confirmed skills.
    //
    // Two rules to prevent silent data loss:
    //   1. Clear ONLY the previous extracted-source rows. Manual rows are kept.
    //   2. When inserting an extracted skill, never overwrite a manual row
    //      that already exists for the same skill_id (the student curated it).
    if (skills && skills.length > 0) {
      await connection.execute(
        "DELETE FROM has_skill WHERE student_user_id = ? AND source = 'extracted'",
        [userId]
      );

      for (const skill of skills) {
        let skillId = skill.skillId;

        if (!skillId) {
          const resolved = await findOrCreateSkill(connection, skill.skillName, skill.category || 'other');
          skillId = resolved.skillId;
        }

        // INSERT IGNORE so we never clobber a pre-existing (manual) row.
        await connection.execute(
          `INSERT IGNORE INTO has_skill (student_user_id, skill_id, proficiency_level, source)
           VALUES (?, ?, ?, 'extracted')`,
          [userId, skillId, skill.proficiencyLevel || 'intermediate']
        );
      }
    }

    await connection.commit();

    // Delete old physical file if no applications reference it
    if (oldResume.length > 0 && oldResume[0].file_path) {
      const [refs] = await pool.execute(
        'SELECT COUNT(*) AS count FROM application WHERE submitted_resume_path = ?',
        [oldResume[0].file_path]
      );
      if (refs[0].count === 0) {
        const oldFile = path.join(uploadDir, oldResume[0].file_path.replace('/uploads/', ''));
        fs.unlink(oldFile, () => {});
      }
    }

    // Fire-and-forget: regenerate student embedding after resume replacement
    embeddingService.updateStudentEmbedding(userId).catch(() => {});

    res.json({
      success: true,
      message: 'Resume confirmed and skills saved',
      data: { resumeId: newResumeId },
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const getResume = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [rows] = await pool.execute(
    `SELECT r.resume_id, r.original_filename, r.file_type, r.file_path, r.created_at
     FROM resume r
     JOIN student s ON s.primary_resume_id = r.resume_id AND s.user_id = r.student_user_id
     WHERE r.student_user_id = ?`,
    [userId]
  );

  if (rows.length === 0) {
    throw new AppError('No resume found', 404);
  }

  const r = rows[0];
  res.json({
    success: true,
    data: {
      resumeId: r.resume_id,
      originalFilename: r.original_filename,
      fileType: r.file_type,
      filePath: r.file_path,
      uploadedAt: r.created_at,
    },
  });
});

const deleteResume = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [rows] = await pool.execute(
    'SELECT resume_id, file_path FROM resume WHERE student_user_id = ?',
    [userId]
  );

  if (rows.length === 0) {
    throw new AppError('No resume to delete', 404);
  }

  const { resume_id: resumeId, file_path: filePath } = rows[0];

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      'UPDATE student SET primary_resume_id = NULL WHERE user_id = ?',
      [userId]
    );
    await connection.execute(
      'UPDATE application SET resume_id = NULL WHERE resume_id = ?',
      [resumeId]
    );
    await connection.execute(
      'DELETE FROM resume WHERE resume_id = ?',
      [resumeId]
    );

    // Clear extracted skills
    await connection.execute(
      "DELETE FROM has_skill WHERE student_user_id = ? AND source = 'extracted'",
      [userId]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  if (filePath) {
    const [refs] = await pool.execute(
      'SELECT COUNT(*) AS count FROM application WHERE submitted_resume_path = ?',
      [filePath]
    );
    if (refs[0].count === 0) {
      const fullPath = path.join(uploadDir, filePath.replace('/uploads/', ''));
      fs.unlink(fullPath, () => {});
    }
  }

  // Fire-and-forget: regenerate student embedding after resume deletion
  embeddingService.updateStudentEmbedding(req.user.userId).catch(() => {});

  res.json({ success: true, message: 'Resume deleted' });
});

const getSkills = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [rows] = await pool.execute(
    `SELECT hs.skill_id, s.display_name, s.normalized_name, s.category,
            hs.proficiency_level, hs.source
     FROM has_skill hs
     JOIN skill s ON s.skill_id = hs.skill_id
     WHERE hs.student_user_id = ?
     ORDER BY s.category, s.display_name`,
    [userId]
  );

  res.json({
    success: true,
    data: rows.map((r) => ({
      skillId: r.skill_id,
      displayName: r.display_name,
      normalizedName: r.normalized_name,
      category: r.category,
      proficiencyLevel: r.proficiency_level,
      source: r.source,
    })),
  });
});

//
// Adds skills WITHOUT overwriting existing ones. If a skill resolves (via
// alias or semantic match) to one the student already has, it is skipped
// rather than silently downgrading the previously-set proficiency. The
// caller gets a per-skill report so the UI can surface what actually
// happened.
const addSkills = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { skills } = req.body;

  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    throw new AppError('Skills array is required', 400);
  }

  const added = [];
  const skipped = [];

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const skill of skills) {
      const inputName = skill.skillName || (skill.skillId ? `#${skill.skillId}` : null);
      let skillId = skill.skillId;
      let resolvedName = skill.skillName;
      let matchedVia = 'id';

      if (!skillId && skill.skillName) {
        const resolved = await findOrCreateSkill(connection, skill.skillName, skill.category || 'other');
        skillId = resolved.skillId;
        resolvedName = resolved.displayName;
        matchedVia = resolved.matchedVia;
      }

      if (!skillId) continue;

      const [existing] = await connection.execute(
        'SELECT proficiency_level FROM has_skill WHERE student_user_id = ? AND skill_id = ?',
        [userId, skillId]
      );

      if (existing.length > 0) {
        skipped.push({
          inputName,
          resolvedName,
          matchedVia,
          existingProficiency: existing[0].proficiency_level,
          reason: matchedVia === 'exact' || matchedVia === 'id'
            ? 'already_in_profile'
            : 'matched_existing_skill',
        });
        continue;
      }

      await connection.execute(
        `INSERT INTO has_skill (student_user_id, skill_id, proficiency_level, source)
         VALUES (?, ?, ?, ?)`,
        [userId, skillId, skill.proficiencyLevel || 'intermediate', skill.source || 'manual']
      );
      added.push({ inputName, resolvedName, skillId, matchedVia });
    }

    await connection.commit();

    if (added.length > 0) {
      embeddingService.updateStudentEmbedding(userId).catch(() => {});
    }

    res.json({
      success: true,
      message: added.length > 0
        ? `Added ${added.length} skill${added.length === 1 ? '' : 's'}`
        : 'No new skills added',
      data: { added, skipped },
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const updateSkill = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { skillId } = req.params;
  const { proficiencyLevel } = req.body;

  const [result] = await pool.execute(
    'UPDATE has_skill SET proficiency_level = ? WHERE student_user_id = ? AND skill_id = ?',
    [proficiencyLevel, userId, skillId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('Skill not found in your profile', 404);
  }

  // Fire-and-forget: regenerate student embedding after skill update
  embeddingService.updateStudentEmbedding(userId).catch(() => {});

  res.json({ success: true, message: 'Skill updated' });
});

const deleteSkill = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { skillId } = req.params;

  const [result] = await pool.execute(
    'DELETE FROM has_skill WHERE student_user_id = ? AND skill_id = ?',
    [userId, skillId]
  );

  if (result.affectedRows === 0) {
    throw new AppError('Skill not found in your profile', 404);
  }

  // Fire-and-forget: regenerate student embedding after skill deletion
  embeddingService.updateStudentEmbedding(userId).catch(() => {});

  res.json({ success: true, message: 'Skill removed' });
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
  if (!match) {
    throw new AppError('Current password is incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await pool.execute(
    'UPDATE users SET password = ?, token_version = token_version + 1 WHERE user_id = ?',
    [hashedPassword, userId]
  );

  // Log
  try {
    await pool.execute(
      'INSERT INTO system_log (user_id, action, ip_address) VALUES (?, ?, ?)',
      [userId, 'password_changed', req.ip]
    );
  } catch (err) {
    console.error('System log failed:', err.message);
  }

  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

const getNotificationPreferences = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [rows] = await pool.execute(
    `SELECT email_application_status, email_new_message, email_recommendations, email_invitation
     FROM notification_preference WHERE user_id = ?`,
    [userId]
  );

  if (rows.length === 0) throw new AppError('Preferences not found', 404);

  res.json({
    success: true,
    data: {
      emailApplicationStatus: !!rows[0].email_application_status,
      emailNewMessage: !!rows[0].email_new_message,
      emailRecommendations: !!rows[0].email_recommendations,
      emailInvitation: !!rows[0].email_invitation,
    },
  });
});

const updateNotificationPreferences = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { emailApplicationStatus, emailNewMessage, emailRecommendations, emailInvitation } = req.body;

  const fields = [];
  const values = [];

  if (emailApplicationStatus !== undefined) { fields.push('email_application_status = ?'); values.push(emailApplicationStatus ? 1 : 0); }
  if (emailNewMessage !== undefined) { fields.push('email_new_message = ?'); values.push(emailNewMessage ? 1 : 0); }
  if (emailRecommendations !== undefined) { fields.push('email_recommendations = ?'); values.push(emailRecommendations ? 1 : 0); }
  if (emailInvitation !== undefined) { fields.push('email_invitation = ?'); values.push(emailInvitation ? 1 : 0); }

  if (fields.length === 0) throw new AppError('No preferences to update', 400);

  values.push(userId);
  await pool.execute(
    `UPDATE notification_preference SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );

  res.json({ success: true, message: 'Notification preferences updated' });
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

  const [resumeRows] = await pool.execute(
    'SELECT file_path FROM resume WHERE student_user_id = ?',
    [userId]
  );

  // Delete user (cascades to student, resume, has_skill, applications, etc.)
  await pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);

  // Best-effort file cleanup
  if (rows[0].profile_picture) {
    const picFile = path.join(uploadDir, rows[0].profile_picture.replace('/uploads/', ''));
    fs.unlink(picFile, () => {});
  }
  for (const r of resumeRows) {
    if (r.file_path) {
      const resumeFile = path.join(uploadDir, r.file_path.replace('/uploads/', ''));
      fs.unlink(resumeFile, () => {});
    }
  }

  res.json({ success: true, message: 'Account deleted permanently' });
});

// Canonical skill name aliases
const SKILL_ALIASES = {
  'c++': 'cpp',
  'c#': 'csharp',
  'node.js': 'nodejs',
  '.net': 'dotnet',
  'react native': 'reactnative',
  'ci/cd': 'cicd',
};

function normalizeSkillName(name) {
  let normalized = name.toLowerCase().trim();
  if (SKILL_ALIASES[normalized]) return SKILL_ALIASES[normalized];
  // Generic: lowercase, strip spaces/dots/hyphens/underscores/slashes (but not all special chars)
  normalized = normalized.replace(/[\s.\-_/]/g, '');
  return normalized;
}

async function extractSkillsFromText(text) {
  if (!text || text.trim().length < 20) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackSkillExtraction(text);

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_GENERATION_MODEL || 'gemini-2.5-flash-lite',
  });

  const prompt = `Extract technical and professional skills from this resume text. Return a JSON array where each item has:
- "skill_name": the skill name (e.g. "Python", "React", "Project Management")
- "category": one of: programming, web, data, ai_ml, devops, mobile, design, soft_skill, other
- "proficiency_estimate": one of: beginner, intermediate, advanced (based on context clues like years of experience, project complexity)

Only return the JSON array, no other text. Be thorough but avoid false positives.

Resume text:
${text.substring(0, 3000)}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Parse defensively
  let parsed;
  try {
    parsed = JSON.parse(response);
  } catch {
    const match = response.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Could not parse LLM response');
    }
  }

  if (!Array.isArray(parsed)) return [];

  // Cross-reference with skill table
  const results = [];
  for (const item of parsed) {
    if (!item.skill_name || typeof item.skill_name !== 'string') continue;

    const validCategories = ['programming', 'web', 'data', 'ai_ml', 'devops', 'mobile', 'design', 'soft_skill', 'other'];
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    const category = validCategories.includes(item.category) ? item.category : 'other';
    const proficiency = validLevels.includes(item.proficiency_estimate) ? item.proficiency_estimate : 'intermediate';

    const normalizedName = normalizeSkillName(item.skill_name);
    const [existing] = await pool.execute(
      'SELECT skill_id, display_name FROM skill WHERE normalized_name = ?',
      [normalizedName]
    );

    results.push({
      skillId: existing.length > 0 ? existing[0].skill_id : null,
      skillName: existing.length > 0 ? existing[0].display_name : item.skill_name,
      category,
      proficiencyLevel: proficiency,
      source: 'extracted',
      isNew: existing.length === 0,
    });
  }

  return results;
}

async function fallbackSkillExtraction(text) {
  if (!text) return [];

  const [allSkills] = await pool.execute(
    'SELECT skill_id, display_name, normalized_name, category FROM skill'
  );

  const textLower = text.toLowerCase();
  const results = [];

  for (const skill of allSkills) {
    // Check if skill name appears in text (word boundary matching)
    const displayLower = skill.display_name.toLowerCase();
    const regex = new RegExp(`\\b${displayLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textLower)) {
      results.push({
        skillId: skill.skill_id,
        skillName: skill.display_name,
        category: skill.category,
        proficiencyLevel: 'intermediate',
        source: 'extracted',
        isNew: false,
      });
    }
  }

  return results;
}

const WITHDRAWABLE_STATUSES = ['pending', 'under_review', 'interview_scheduled'];

const getApplications = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { page = 1, limit = 20, status, sort = 'newest' } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = ['a.student_user_id = ?'];
  const params = [String(studentId)];

  if (status && ['pending', 'under_review', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
    whereClauses.push('a.status = ?');
    params.push(status);
  }

  const whereSQL = whereClauses.join(' AND ');

  let orderSQL;
  switch (sort) {
    case 'oldest':
      orderSQL = 'a.applied_date ASC';
      break;
    case 'score_high':
      orderSQL = 'a.match_score IS NULL, a.match_score DESC';
      break;
    case 'score_low':
      orderSQL = 'a.match_score IS NULL, a.match_score ASC';
      break;
    default:
      orderSQL = 'a.applied_date DESC';
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM application a WHERE ${whereSQL}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT
      a.application_id, a.internship_id, a.status, a.match_score,
      a.cover_letter, a.applied_date, a.status_updated_at,
      a.submitted_resume_filename, a.employer_note,
      i.title AS internship_title, i.location, i.work_type, i.deadline,
      i.status AS internship_status,
      e.company_name, e.company_logo, e.industry
    FROM application a
    JOIN internship i ON a.internship_id = i.internship_id
    JOIN employer e ON i.employer_user_id = e.user_id
    WHERE ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT ? OFFSET ?`,
    [...params, String(limitNum), String(offset)]
  );

  const data = rows.map((r) => ({
    applicationId: r.application_id,
    internshipId: r.internship_id,
    status: r.status,
    matchScore: r.match_score ? Number(r.match_score) : null,
    coverLetter: r.cover_letter,
    appliedDate: r.applied_date,
    statusUpdatedAt: r.status_updated_at,
    resumeFilename: r.submitted_resume_filename,
    employerNote: r.employer_note,
    internship: {
      title: r.internship_title,
      location: r.location,
      workType: r.work_type,
      deadline: r.deadline,
      status: r.internship_status,
    },
    employer: {
      companyName: r.company_name,
      companyLogo: r.company_logo,
      industry: r.industry,
    },
  }));

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

const getApplication = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { id } = req.params;

  const [rows] = await pool.execute(
    `SELECT
      a.application_id, a.internship_id, a.status, a.match_score,
      a.cover_letter, a.applied_date, a.status_updated_at,
      a.submitted_resume_filename, a.submitted_resume_path, a.employer_note,
      i.title AS internship_title, i.description AS internship_description,
      i.location, i.work_type, i.duration_months, i.salary_min, i.salary_max,
      i.deadline, i.status AS internship_status, i.created_at AS internship_created_at,
      e.company_name, e.company_logo, e.industry, e.company_size
    FROM application a
    JOIN internship i ON a.internship_id = i.internship_id
    JOIN employer e ON i.employer_user_id = e.user_id
    WHERE a.application_id = ? AND a.student_user_id = ?`,
    [String(id), String(studentId)]
  );

  if (rows.length === 0) {
    throw new AppError('Application not found', 404);
  }

  const r = rows[0];

  res.json({
    success: true,
    data: {
      applicationId: r.application_id,
      internshipId: r.internship_id,
      status: r.status,
      matchScore: r.match_score ? Number(r.match_score) : null,
      coverLetter: r.cover_letter,
      appliedDate: r.applied_date,
      statusUpdatedAt: r.status_updated_at,
      resumeFilename: r.submitted_resume_filename,
      employerNote: r.employer_note,
      internship: {
        title: r.internship_title,
        description: r.internship_description,
        location: r.location,
        workType: r.work_type,
        durationMonths: r.duration_months,
        salaryMin: r.salary_min ? Number(r.salary_min) : null,
        salaryMax: r.salary_max ? Number(r.salary_max) : null,
        deadline: r.deadline,
        status: r.internship_status,
        createdAt: r.internship_created_at,
      },
      employer: {
        companyName: r.company_name,
        companyLogo: r.company_logo,
        industry: r.industry,
        companySize: r.company_size,
      },
    },
  });
});

const getApplicationHistory = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { id } = req.params;

  // Verify ownership
  const [appRows] = await pool.execute(
    'SELECT application_id FROM application WHERE application_id = ? AND student_user_id = ?',
    [String(id), String(studentId)]
  );
  if (appRows.length === 0) {
    throw new AppError('Application not found', 404);
  }

  const [rows] = await pool.execute(
    `SELECT
      h.old_status, h.new_status, h.created_at,
      u.full_name AS changed_by_name, u.role AS changed_by_role
    FROM application_status_history h
    LEFT JOIN users u ON h.changed_by_user_id = u.user_id
    WHERE h.application_id = ?
    ORDER BY h.created_at ASC`,
    [String(id)]
  );

  res.json({
    success: true,
    data: rows.map((r) => ({
      oldStatus: r.old_status,
      newStatus: r.new_status,
      createdAt: r.created_at,
      changedBy: r.changed_by_name,
      changedByRole: r.changed_by_role,
    })),
  });
});

const applyToInternship = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { internshipId, coverLetter } = req.body;

  if (!internshipId) {
    throw new AppError('Internship ID is required', 400);
  }

  const [resumeRows] = await pool.execute(
    'SELECT primary_resume_id FROM student WHERE user_id = ?',
    [String(studentId)]
  );
  if (!resumeRows[0]?.primary_resume_id) {
    throw new AppError('Upload a resume before applying', 400);
  }

  const [resumeInfo] = await pool.execute(
    'SELECT resume_id, file_path, original_filename FROM resume WHERE resume_id = ? AND student_user_id = ?',
    [String(resumeRows[0].primary_resume_id), String(studentId)]
  );
  if (resumeInfo.length === 0) {
    throw new AppError('Resume not found', 400);
  }
  const resume = resumeInfo[0];

  const [internRows] = await pool.execute(
    `SELECT i.internship_id, i.title, i.employer_user_id, i.status, i.deadline,
            u.is_active AS employer_active
     FROM internship i
     JOIN users u ON i.employer_user_id = u.user_id
     WHERE i.internship_id = ?`,
    [String(internshipId)]
  );
  if (internRows.length === 0) {
    throw new AppError('Internship not found', 404);
  }
  const internship = internRows[0];

  if (internship.status !== 'active') {
    throw new AppError('This internship is not accepting applications', 400);
  }
  if (!internship.employer_active) {
    throw new AppError('This internship is not accepting applications', 400);
  }
  if (internship.deadline && new Date(internship.deadline) < new Date(new Date().toISOString().split('T')[0])) {
    throw new AppError('Application deadline has passed', 400);
  }

  const { computeSkillScore, computeProfileBonus } = require('./internshipController');

  const [requiredSkills] = await pool.execute(
    `SELECT skill_id, required_level, is_mandatory
     FROM requires_skill WHERE internship_id = ?`,
    [String(internshipId)]
  );
  const formattedReqSkills = requiredSkills.map((rs) => ({
    skillId: rs.skill_id,
    requiredLevel: rs.required_level,
    isMandatory: !!rs.is_mandatory,
  }));

  const [studentSkills] = await pool.execute(
    'SELECT skill_id, proficiency_level FROM has_skill WHERE student_user_id = ?',
    [String(studentId)]
  );
  const studentSkillMap = {};
  for (const sk of studentSkills) {
    studentSkillMap[sk.skill_id] = sk.proficiency_level;
  }

  const profileBonus = await computeProfileBonus(studentId);
  const semanticScore = await embeddingService.computeSemanticScore(studentId, internshipId);

  let matchScore;
  if (formattedReqSkills.length === 0) {
    matchScore = profileBonus * 100;
  } else {
    const skillScore = computeSkillScore(formattedReqSkills, studentSkillMap);
    if (semanticScore !== null) {
      matchScore = skillScore * 0.65 + semanticScore * 0.20 + profileBonus * 100 * 0.15;
    } else {
      matchScore = skillScore * 0.80 + profileBonus * 100 * 0.20;
    }
  }

  const connection = await pool.getConnection();
  let applicationId;
  try {
    await connection.beginTransaction();

    try {
      const [result] = await connection.execute(
        `INSERT INTO application
          (student_user_id, internship_id, resume_id, submitted_resume_path,
           submitted_resume_filename, cover_letter, match_score, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          String(studentId),
          String(internshipId),
          String(resume.resume_id),
          resume.file_path,
          resume.original_filename,
          coverLetter || null,
          matchScore != null ? matchScore.toFixed(2) : null,
        ]
      );
      applicationId = result.insertId;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError('You have already applied to this internship', 409);
      }
      throw err;
    }

    await connection.execute(
      `INSERT INTO application_status_history
        (application_id, old_status, new_status, changed_by_user_id)
       VALUES (?, NULL, 'pending', ?)`,
      [String(applicationId), String(studentId)]
    );

    await connection.execute(
      `INSERT INTO notification
        (user_id, type, title, message, reference_id, reference_type)
       VALUES (?, 'new_application', ?, ?, ?, 'application')`,
      [
        String(internship.employer_user_id),
        `New application for "${internship.title}"`,
        `A student has applied to your internship "${internship.title}".`,
        String(internshipId),
      ]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${internship.employer_user_id}`).emit('notification:new', {
      type: 'new_application',
      title: `New application for "${internship.title}"`,
      referenceId: internshipId,
      referenceType: 'application',
    });
  }

  res.status(201).json({
    success: true,
    data: {
      applicationId,
      matchScore: matchScore != null ? Math.round(matchScore) : null,
    },
    message: 'Application submitted successfully',
  });
});

const withdrawApplication = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { id } = req.params;

  const [rows] = await pool.execute(
    'SELECT application_id, status, internship_id FROM application WHERE application_id = ? AND student_user_id = ?',
    [String(id), String(studentId)]
  );

  if (rows.length === 0) {
    throw new AppError('Application not found', 404);
  }

  const app = rows[0];

  if (!WITHDRAWABLE_STATUSES.includes(app.status)) {
    throw new AppError(`Cannot withdraw an application that is already ${app.status}`, 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      "UPDATE application SET status = 'withdrawn', status_updated_at = NOW() WHERE application_id = ?",
      [String(id)]
    );

    await connection.execute(
      `INSERT INTO application_status_history
        (application_id, old_status, new_status, changed_by_user_id)
       VALUES (?, ?, 'withdrawn', ?)`,
      [String(id), app.status, String(studentId)]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  res.json({ success: true, message: 'Application withdrawn' });
});

const getBookmarks = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM bookmark WHERE student_user_id = ?',
    [String(studentId)]
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT
      i.internship_id, i.title, i.location, i.work_type, i.duration_months,
      i.salary_min, i.salary_max, i.deadline, i.created_at, i.status,
      e.company_name, e.company_logo, e.industry,
      b.created_at AS bookmarked_at
    FROM bookmark b
    JOIN internship i ON b.internship_id = i.internship_id
    JOIN employer e ON i.employer_user_id = e.user_id
    WHERE b.student_user_id = ?
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?`,
    [String(studentId), String(limitNum), String(offset)]
  );

  res.json({
    success: true,
    data: rows.map((r) => ({
      internshipId: r.internship_id,
      title: r.title,
      location: r.location,
      workType: r.work_type,
      durationMonths: r.duration_months,
      salaryMin: r.salary_min ? Number(r.salary_min) : null,
      salaryMax: r.salary_max ? Number(r.salary_max) : null,
      deadline: r.deadline,
      createdAt: r.created_at,
      status: r.status,
      employer: { companyName: r.company_name, companyLogo: r.company_logo, industry: r.industry },
      bookmarkedAt: r.bookmarked_at,
    })),
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

const addBookmark = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { internshipId } = req.params;

  try {
    await pool.execute(
      'INSERT INTO bookmark (student_user_id, internship_id) VALUES (?, ?)',
      [String(studentId), String(internshipId)]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ success: true, message: 'Already bookmarked' });
    }
    throw err;
  }

  res.status(201).json({ success: true, message: 'Bookmarked' });
});

const removeBookmark = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { internshipId } = req.params;

  await pool.execute(
    'DELETE FROM bookmark WHERE student_user_id = ? AND internship_id = ?',
    [String(studentId), String(internshipId)]
  );

  res.json({ success: true, message: 'Bookmark removed' });
});

const getRecommendations = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { page = 1, limit = 20, minScore = 0, scope = 'industry' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const minScoreNum = Math.max(0, Math.min(100, parseInt(minScore, 10) || 0));

  const {
    computeSkillScore,
    computeProfileBonus,
    formatInternshipListItem,
    deriveIndustryFromMajor,
  } = require('./internshipController');

  // Resolve student's industry from major when scope=industry (default)
  let studentIndustry = null;
  if (scope === 'industry') {
    const [studentRows] = await pool.execute(
      'SELECT major FROM student WHERE user_id = ?',
      [String(userId)]
    );
    studentIndustry = studentRows[0] ? deriveIndustryFromMajor(studentRows[0].major) : null;
  }

  // Get all active visible internships, optionally filtered by industry
  let industryClause = '';
  const queryParams = [];
  if (scope === 'industry' && studentIndustry) {
    industryClause = ' AND e.industry = ?';
    queryParams.push(studentIndustry);
  }

  const [internships] = await pool.execute(
    `SELECT
       i.internship_id, i.title, i.description, i.location,
       i.duration_months, i.work_type, i.salary_min, i.salary_max,
       i.deadline, i.created_at,
       e.company_name, e.company_logo, e.industry, e.user_id AS employer_user_id
     FROM internship i
     JOIN employer e ON i.employer_user_id = e.user_id
     JOIN users u_emp ON e.user_id = u_emp.user_id AND u_emp.is_active = TRUE
     WHERE i.status = 'active'
       AND (i.deadline IS NULL OR i.deadline >= CURDATE())
       ${industryClause}
     ORDER BY i.created_at DESC`,
    queryParams
  );

  if (internships.length === 0) {
    return res.json({
      success: true,
      data: [],
      pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
    });
  }

  // Batch-fetch required skills for all internships
  const ids = internships.map((i) => i.internship_id);
  const placeholders = ids.map(() => '?').join(',');
  const [allSkills] = await pool.execute(
    `SELECT rs.internship_id, s.skill_id, s.display_name, rs.required_level, rs.is_mandatory
     FROM requires_skill rs
     JOIN skill s ON rs.skill_id = s.skill_id
     WHERE rs.internship_id IN (${placeholders})`,
    ids.map(String)
  );

  const skillMap = {};
  for (const sk of allSkills) {
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

  const [studentSkills] = await pool.execute(
    `SELECT hs.skill_id, s.display_name, s.normalized_name, hs.proficiency_level
     FROM has_skill hs
     JOIN skill s ON hs.skill_id = s.skill_id
     WHERE hs.student_user_id = ?`,
    [String(userId)]
  );

  const studentSkillMap = {};
  for (const sk of studentSkills) {
    studentSkillMap[sk.skill_id] = sk.proficiency_level;
  }

  const profileBonus = await computeProfileBonus(userId);

  // Score each internship with full breakdown
  const scored = [];
  for (const intern of internships) {
    const skills = intern.skills || [];
    let skillScore = 0;
    let semanticScore = null;
    let totalScore = 0;

    if (skills.length === 0) {
      totalScore = Math.round(profileBonus * 20);
    } else {
      skillScore = computeSkillScore(skills, studentSkillMap);
      semanticScore = await embeddingService.computeSemanticScore(userId, intern.internship_id);

      if (semanticScore !== null) {
        totalScore = Math.round(skillScore * 0.65 + semanticScore * 0.20 + profileBonus * 100 * 0.15);
      } else {
        totalScore = Math.round(skillScore * 0.80 + profileBonus * 100 * 0.20);
      }
    }

    if (totalScore < minScoreNum) continue;

    // Build skill comparison for "Why this match?"
    const skillComparison = skills.map((rs) => {
      const studentLevel = studentSkillMap[rs.skillId] || null;
      return {
        skillName: rs.displayName,
        requiredLevel: rs.requiredLevel,
        studentLevel,
        isMandatory: rs.isMandatory,
        matched: !!studentLevel,
      };
    });

    // Generate rule-based semantic insight
    let semanticInsight = null;
    if (semanticScore !== null) {
      const topCategories = [...new Set(studentSkills.slice(0, 3).map((s) => s.display_name))].join(', ');
      const alignment = semanticScore >= 70 ? 'aligns well with'
        : semanticScore >= 40 ? 'partially aligns with'
        : 'does not closely align with';
      semanticInsight = `Your profile emphasizes ${topCategories || 'your current skills'}, which ${alignment} this ${intern.title} role.`;
    }

    // Generate improvement tip
    const missingMandatory = skillComparison.filter((s) => s.isMandatory && !s.matched);
    const missingOptional = skillComparison.filter((s) => !s.isMandatory && !s.matched);
    let improvementTip = null;
    if (missingMandatory.length > 0) {
      improvementTip = `Adding ${missingMandatory[0].skillName} to your skills would strengthen your match for this role.`;
    } else if (missingOptional.length > 0) {
      improvementTip = `You match all mandatory skills! Consider adding ${missingOptional[0].skillName} to strengthen your profile.`;
    } else if (skills.length > 0) {
      improvementTip = 'Great match — you have all the skills this internship requires.';
    }

    const formatted = formatInternshipListItem(intern);
    formatted.matchScore = totalScore;
    formatted.breakdown = {
      skillScore: Math.round(skillScore),
      semanticScore,
      profileBonus: Math.round(profileBonus * 100),
    };
    formatted.skillComparison = skillComparison;
    formatted.semanticInsight = semanticInsight;
    formatted.improvementTip = improvementTip;

    scored.push(formatted);
  }

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  const total = scored.length;
  const paged = scored.slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum);

  res.json({
    success: true,
    data: paged,
    meta: { scope, studentIndustry },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  uploadResume,
  confirmResume,
  getResume,
  deleteResume,
  getSkills,
  addSkills,
  updateSkill,
  deleteSkill,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteAccount,
  getApplications,
  getApplication,
  getApplicationHistory,
  applyToInternship,
  withdrawApplication,
  getBookmarks,
  addBookmark,
  removeBookmark,
  getRecommendations,
};
