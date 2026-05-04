const express = require('express');
const { body, param, query } = require('express-validator');
const employerController = require('../controllers/employerController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { uploadProfilePicture: uploadPictureMiddleware, uploadCompanyLogo: uploadLogoMiddleware } = require('../middleware/upload');

const router = express.Router();

// All routes require employer auth
router.use(authenticate, authorize('employer'));

router.get('/profile', employerController.getProfile);

router.put(
  '/profile',
  [
    body('fullName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Full name cannot be empty')
      .isLength({ max: 100 }),
    body('companyName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Company name cannot be empty')
      .isLength({ max: 150 }),
    body('industry')
      .optional()
      .trim()
      .notEmpty(),
    body('companySize')
      .optional()
      .isIn(['1-50', '51-200', '201-500', '500+'])
      .withMessage('Invalid company size'),
    body('companyDescription')
      .optional({ values: 'null' })
      .isLength({ max: 5000 }),
    body('websiteUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('linkedinUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('twitterUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('facebookUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('instagramUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('location')
      .optional({ values: 'null' })
      .isLength({ max: 150 }),
  ],
  handleValidationErrors,
  employerController.updateProfile
);

router.post('/profile/picture', uploadPictureMiddleware, employerController.uploadProfilePicture);
router.post('/profile/logo', uploadLogoMiddleware, employerController.uploadCompanyLogo);

router.post(
  '/extract-skills',
  [
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 30, max: 10000 })
      .withMessage('Description must be 30–10,000 characters'),
  ],
  handleValidationErrors,
  employerController.extractSkillsFromJobDescription
);

router.post(
  '/internships',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 }),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required')
      .isLength({ max: 150 }),
    body('workType')
      .isIn(['remote', 'hybrid', 'on-site'])
      .withMessage('Work type must be remote, hybrid, or on-site'),
    body('durationMonths')
      .isInt({ min: 1, max: 24 })
      .withMessage('Duration must be 1-24 months'),
    body('salaryMin')
      .optional({ values: 'null' })
      .isFloat({ min: 0 })
      .withMessage('Minimum salary must be non-negative'),
    body('salaryMax')
      .optional({ values: 'null' })
      .isFloat({ min: 0 })
      .withMessage('Maximum salary must be non-negative'),
    body('skills')
      .isArray({ min: 1 })
      .withMessage('At least one skill is required'),
  ],
  handleValidationErrors,
  employerController.createInternship
);

router.get('/internships', employerController.getInternships);

router.get(
  '/internships/:id',
  [param('id').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  employerController.getInternship
);

router.put(
  '/internships/:id',
  [
    param('id').isInt().withMessage('Invalid internship ID'),
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .isLength({ max: 200 }),
    body('description')
      .optional()
      .trim()
      .notEmpty(),
    body('location')
      .optional()
      .trim()
      .notEmpty()
      .isLength({ max: 150 }),
    body('workType')
      .optional()
      .isIn(['remote', 'hybrid', 'on-site']),
    body('durationMonths')
      .optional()
      .isInt({ min: 1, max: 24 }),
    body('salaryMin')
      .optional({ values: 'null' })
      .isFloat({ min: 0 }),
    body('salaryMax')
      .optional({ values: 'null' })
      .isFloat({ min: 0 }),
  ],
  handleValidationErrors,
  employerController.updateInternship
);

router.put(
  '/internships/:id/resubmit',
  [param('id').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  employerController.resubmitInternship
);

router.put(
  '/internships/:id/close',
  [param('id').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  employerController.closeInternship
);

router.put(
  '/internships/:id/reopen',
  [param('id').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  employerController.reopenInternship
);

router.delete(
  '/internships/:id',
  [param('id').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  employerController.deleteInternship
);

router.get(
  '/internships/:id/applicants',
  [param('id').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  employerController.getApplicants
);

router.get(
  '/applicants/:studentId/profile',
  [param('studentId').isInt().withMessage('Invalid student ID')],
  handleValidationErrors,
  employerController.getApplicantProfile
);

router.put(
  '/applications/:id/status',
  [
    param('id').isInt().withMessage('Invalid application ID'),
    body('status')
      .isIn(['under_review', 'interview_scheduled', 'accepted', 'rejected'])
      .withMessage('Invalid status'),
    body('note')
      .optional({ values: 'null' })
      .isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  employerController.updateApplicationStatus
);

router.get(
  '/applications/:id/resume',
  [param('id').isInt().withMessage('Invalid application ID')],
  handleValidationErrors,
  employerController.downloadResume
);

router.get('/top-candidates', employerController.getTopCandidates);

router.get(
  '/internships/:id/candidates',
  [param('id').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  employerController.getCandidates
);

router.post(
  '/internships/:internshipId/invite/:studentId',
  [
    param('internshipId').isInt().withMessage('Invalid internship ID'),
    param('studentId').isInt().withMessage('Invalid student ID'),
    body('message')
      .optional({ values: 'null' })
      .isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  employerController.inviteStudent
);

router.get('/analytics', employerController.getAnalytics);

router.get('/notifications', employerController.getNotifications);

router.put(
  '/notifications/:id/read',
  [param('id').isInt().withMessage('Invalid notification ID')],
  handleValidationErrors,
  employerController.markNotificationRead
);

router.put('/notifications/read-all', employerController.markAllNotificationsRead);

router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
  ],
  handleValidationErrors,
  employerController.changePassword
);

router.get('/notification-preferences', employerController.getNotificationPreferences);
router.put('/notification-preferences', employerController.updateNotificationPreferences);

router.delete(
  '/account',
  [body('password').notEmpty().withMessage('Password confirmation is required')],
  handleValidationErrors,
  employerController.deleteAccount
);

module.exports = router;
