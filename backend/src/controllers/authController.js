const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendEmail } = require('../config/email');

const BCRYPT_SALT_ROUNDS = 12;

const VALID_INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing',
  'Engineering',
  'Other',
];

const VALID_COMPANY_SIZES = ['1-50', '51-200', '201-500', '500+'];

function signToken(userId, role, tokenVersion, rememberMe = false) {
  return jwt.sign(
    { userId, role, tokenVersion },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe
        ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d'
        : process.env.JWT_EXPIRES_IN || '24h',
    }
  );
}

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function logAction(userId, action, details, ipAddress) {
  try {
    await pool.execute(
      'INSERT INTO system_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, details, ipAddress]
    );
  } catch (err) {
    console.error('System log insert failed:', err.message);
  }
}

const register = catchAsync(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, role]
    );
    const userId = userResult.insertId;

    if (role === 'student') {
      const { university, major, graduationYear, gender, dateOfBirth } = req.body;
      await connection.execute(
        'INSERT INTO student (user_id, major, university, graduation_year, gender, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, major, university, graduationYear, gender || null, dateOfBirth || null]
      );
    } else if (role === 'employer') {
      const { companyName, industry, companySize } = req.body;
      await connection.execute(
        'INSERT INTO employer (user_id, company_name, industry, company_size) VALUES (?, ?, ?, ?)',
        [userId, companyName, industry, companySize]
      );
    }

    await connection.execute(
      'INSERT INTO notification_preference (user_id) VALUES (?)',
      [userId]
    );

    await connection.commit();

    logAction(userId, 'user_registered', JSON.stringify({ role }), req.ip);

    sendEmail(
      email,
      'Welcome to InternMatch!',
      `<h2>Welcome to InternMatch, ${fullName}!</h2>
       <p>Your account has been created successfully as a <strong>${role}</strong>.</p>
       <p>You can now <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login">log in</a> and start exploring.</p>
       <p>The InternMatch Team</p>`
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.',
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const login = catchAsync(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const [rows] = await pool.execute(
    'SELECT user_id, full_name, email, password, role, is_active, profile_picture, token_version FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = rows[0];

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.is_active) {
    throw new AppError('Account deactivated. Please contact an admin.', 403);
  }

  const token = signToken(user.user_id, user.role, user.token_version, rememberMe);

  const userData = {
    userId: user.user_id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    isActive: !!user.is_active,
    profilePicture: user.profile_picture,
  };

  if (user.role === 'student') {
    const [studentRows] = await pool.execute(
      'SELECT major, university, graduation_year, primary_resume_id FROM student WHERE user_id = ?',
      [user.user_id]
    );
    if (studentRows.length > 0) {
      const s = studentRows[0];
      const currentYear = new Date().getFullYear();
      userData.university = s.university;
      userData.major = s.major;
      userData.graduationYear = s.graduation_year;
      userData.graduationStatus = s.graduation_year < currentYear ? 'graduated' : 'enrolled';
      userData.primaryResumeId = s.primary_resume_id;
    }
  } else if (user.role === 'employer') {
    const [employerRows] = await pool.execute(
      'SELECT company_name, company_logo FROM employer WHERE user_id = ?',
      [user.user_id]
    );
    if (employerRows.length > 0) {
      userData.companyName = employerRows[0].company_name;
      userData.companyLogo = employerRows[0].company_logo;
    }
  } else if (user.role === 'admin') {
    const [adminRows] = await pool.execute(
      'SELECT access_level FROM admin WHERE user_id = ?',
      [user.user_id]
    );
    if (adminRows.length > 0) {
      userData.accessLevel = adminRows[0].access_level;
    }
  }

  logAction(user.user_id, 'user_login', null, req.ip);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { token, user: userData },
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  // Always return the same response to prevent email enumeration.
  const successMessage = 'If an account with this email exists, a reset link has been sent.';

  const [rows] = await pool.execute(
    'SELECT user_id, full_name FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    return res.status(200).json({ success: true, message: successMessage });
  }

  const user = rows[0];

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await pool.execute(
    'INSERT INTO password_reset_token (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [user.user_id, tokenHash, expiresAt]
  );

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
  sendEmail(
    email,
    'Reset your InternMatch password',
    `<h2>Password Reset</h2>
     <p>Hi ${user.full_name},</p>
     <p>You requested a password reset. Click the link below to set a new password:</p>
     <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a></p>
     <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
     <p>The InternMatch Team</p>`
  );

  res.status(200).json({ success: true, message: successMessage });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token) {
    throw new AppError('Reset token is required', 400);
  }

  const tokenHash = hashResetToken(token);

  const [rows] = await pool.execute(
    `SELECT token_id, user_id
     FROM password_reset_token
     WHERE token_hash = ? AND used = 0 AND expires_at > NOW()`,
    [tokenHash]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const { token_id: tokenId, user_id: userId } = rows[0];

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      'UPDATE users SET password = ?, token_version = token_version + 1 WHERE user_id = ?',
      [hashedPassword, userId]
    );

    await connection.execute(
      'UPDATE password_reset_token SET used = 1 WHERE token_id = ?',
      [tokenId]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  logAction(userId, 'password_reset', null, req.ip);

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.',
  });
});

const getMe = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const [userRows] = await pool.execute(
    'SELECT user_id, full_name, email, role, is_active, profile_picture, created_at, updated_at FROM users WHERE user_id = ?',
    [userId]
  );

  if (userRows.length === 0) {
    throw new AppError('User not found', 401);
  }

  const u = userRows[0];
  const data = {
    userId: u.user_id,
    fullName: u.full_name,
    email: u.email,
    role: u.role,
    isActive: !!u.is_active,
    profilePicture: u.profile_picture,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };

  if (u.role === 'student') {
    const [rows] = await pool.execute(
      `SELECT major, university, university_start_date, graduation_year, gpa, bio,
              linkedin_url, github_url, instagram_url, phone, primary_resume_id
       FROM student WHERE user_id = ?`,
      [userId]
    );
    if (rows.length > 0) {
      const s = rows[0];
      const currentYear = new Date().getFullYear();
      data.major = s.major;
      data.university = s.university;
      data.universityStartDate = s.university_start_date;
      data.graduationYear = s.graduation_year;
      data.graduationStatus = s.graduation_year < currentYear ? 'graduated' : 'enrolled';
      data.gpa = s.gpa;
      data.bio = s.bio;
      data.linkedinUrl = s.linkedin_url;
      data.githubUrl = s.github_url;
      data.instagramUrl = s.instagram_url;
      data.phone = s.phone;
      data.primaryResumeId = s.primary_resume_id;
    }
  } else if (u.role === 'employer') {
    const [rows] = await pool.execute(
      `SELECT company_name, industry, company_size, company_description, company_logo,
              website_url, linkedin_url, twitter_url, facebook_url, instagram_url, location
       FROM employer WHERE user_id = ?`,
      [userId]
    );
    if (rows.length > 0) {
      const e = rows[0];
      data.companyName = e.company_name;
      data.industry = e.industry;
      data.companySize = e.company_size;
      data.companyDescription = e.company_description;
      data.companyLogo = e.company_logo;
      data.websiteUrl = e.website_url;
      data.linkedinUrl = e.linkedin_url;
      data.twitterUrl = e.twitter_url;
      data.facebookUrl = e.facebook_url;
      data.instagramUrl = e.instagram_url;
      data.location = e.location;
    }
  } else if (u.role === 'admin') {
    const [rows] = await pool.execute(
      'SELECT access_level FROM admin WHERE user_id = ?',
      [userId]
    );
    if (rows.length > 0) {
      data.accessLevel = rows[0].access_level;
    }
  }

  res.status(200).json({ success: true, data });
});

const logout = catchAsync(async (req, res) => {
  logAction(req.user.userId, 'user_logged_out', null, req.ip);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  VALID_INDUSTRIES,
  VALID_COMPANY_SIZES,
};
