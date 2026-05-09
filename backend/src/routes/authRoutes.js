const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/\d/)
  .withMessage('Password must contain at least one number');

const newPasswordValidation = body('newPassword')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/\d/)
  .withMessage('Password must contain at least one number');

router.post(
  '/register',
  authLimiter,
  [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ max: 100 })
      .withMessage('Full name must be at most 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
      .isLength({ max: 150 })
      .withMessage('Email must be at most 150 characters'),
    passwordValidation,
    body('role')
      .isIn(['student', 'employer'])
      .withMessage('Role must be student or employer'),
    // Student-specific
    body('university')
      .if(body('role').equals('student'))
      .trim()
      .notEmpty()
      .withMessage('University is required')
      .isLength({ max: 150 })
      .withMessage('University must be at most 150 characters'),
    body('major')
      .if(body('role').equals('student'))
      .trim()
      .notEmpty()
      .withMessage('Major is required')
      .isLength({ max: 100 })
      .withMessage('Major must be at most 100 characters'),
    body('graduationYear')
      .if(body('role').equals('student'))
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Graduation year must be between 2000 and 2100'),
    // Employer-specific
    body('companyName')
      .if(body('role').equals('employer'))
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ max: 150 })
      .withMessage('Company name must be at most 150 characters'),
    body('industry')
      .if(body('role').equals('employer'))
      .isIn(authController.VALID_INDUSTRIES)
      .withMessage(
        `Industry must be one of: ${authController.VALID_INDUSTRIES.join(', ')}`
      ),
    body('companySize')
      .if(body('role').equals('employer'))
      .isIn(authController.VALID_COMPANY_SIZES)
      .withMessage(
        `Company size must be one of: ${authController.VALID_COMPANY_SIZES.join(', ')}`
      ),
  ],
  handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  authController.login
);

router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
  ],
  handleValidationErrors,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    newPasswordValidation,
  ],
  handleValidationErrors,
  authController.resetPassword
);

router.get('/me', authenticate, authController.getMe);

router.post('/logout', authenticate, authController.logout);

module.exports = router;
