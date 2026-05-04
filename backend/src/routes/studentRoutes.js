const express = require('express');
const { body, param } = require('express-validator');
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { uploadResume: uploadResumeMiddleware, uploadProfilePicture: uploadPictureMiddleware } = require('../middleware/upload');

const router = express.Router();

// All routes require student auth
router.use(authenticate, authorize('student'));

router.get('/profile', studentController.getProfile);

router.put(
  '/profile',
  [
    body('fullName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Full name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Full name must be at most 100 characters'),
    body('major')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Major cannot be empty')
      .isLength({ max: 100 }),
    body('university')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('University cannot be empty')
      .isLength({ max: 150 }),
    body('graduationYear')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Graduation year must be between 2000 and 2100'),
    body('gpa')
      .optional({ values: 'null' })
      .isFloat({ min: 0, max: 4 })
      .withMessage('GPA must be between 0.00 and 4.00'),
    body('bio')
      .optional({ values: 'null' })
      .isLength({ max: 5000 })
      .withMessage('Bio must be at most 5000 characters'),
    body('linkedinUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('githubUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('instagramUrl')
      .optional({ values: 'null' })
      .isLength({ max: 255 }),
    body('phone')
      .optional({ values: 'null' })
      .isLength({ max: 20 }),
  ],
  handleValidationErrors,
  studentController.updateProfile
);

router.post('/profile/picture', uploadPictureMiddleware, studentController.uploadProfilePicture);
router.delete('/profile/picture', studentController.deleteProfilePicture);

router.post('/resume/upload', uploadResumeMiddleware, studentController.uploadResume);
router.post(
  '/resume/confirm',
  [
    body('staging').notEmpty().withMessage('Staging data is required'),
    body('staging.filePath').notEmpty().withMessage('File path is required'),
  ],
  handleValidationErrors,
  studentController.confirmResume
);
router.get('/resume', studentController.getResume);
router.delete('/resume', studentController.deleteResume);

router.get('/skills', studentController.getSkills);

router.post(
  '/skills',
  [
    body('skills')
      .isArray({ min: 1 })
      .withMessage('Skills array is required and must not be empty'),
    body('skills.*.proficiencyLevel')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Proficiency must be beginner, intermediate, or advanced'),
  ],
  handleValidationErrors,
  studentController.addSkills
);

router.put(
  '/skills/:skillId',
  [
    param('skillId').isInt().withMessage('Invalid skill ID'),
    body('proficiencyLevel')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Proficiency must be beginner, intermediate, or advanced'),
  ],
  handleValidationErrors,
  studentController.updateSkill
);

router.delete(
  '/skills/:skillId',
  [param('skillId').isInt().withMessage('Invalid skill ID')],
  handleValidationErrors,
  studentController.deleteSkill
);

router.get('/applications', studentController.getApplications);

router.get(
  '/applications/:id',
  [param('id').isInt().withMessage('Invalid application ID')],
  handleValidationErrors,
  studentController.getApplication
);

router.get(
  '/applications/:id/history',
  [param('id').isInt().withMessage('Invalid application ID')],
  handleValidationErrors,
  studentController.getApplicationHistory
);

router.post(
  '/applications',
  [
    body('internshipId').isInt().withMessage('Internship ID is required'),
    body('coverLetter')
      .optional({ values: 'null' })
      .isLength({ max: 5000 })
      .withMessage('Cover letter must be at most 5000 characters'),
  ],
  handleValidationErrors,
  studentController.applyToInternship
);

router.put(
  '/applications/:id/withdraw',
  [param('id').isInt().withMessage('Invalid application ID')],
  handleValidationErrors,
  studentController.withdrawApplication
);

router.get('/recommendations', studentController.getRecommendations);

router.get('/bookmarks', studentController.getBookmarks);

router.post(
  '/bookmarks/:internshipId',
  [param('internshipId').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  studentController.addBookmark
);

router.delete(
  '/bookmarks/:internshipId',
  [param('internshipId').isInt().withMessage('Invalid internship ID')],
  handleValidationErrors,
  studentController.removeBookmark
);

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
  studentController.changePassword
);

router.get('/notifications', studentController.getNotifications);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);
router.put(
  '/notifications/:id/read',
  [param('id').isInt().withMessage('Invalid notification ID')],
  handleValidationErrors,
  studentController.markNotificationRead
);

router.get('/notification-preferences', studentController.getNotificationPreferences);
router.put('/notification-preferences', studentController.updateNotificationPreferences);

router.delete(
  '/account',
  [body('password').notEmpty().withMessage('Password confirmation is required')],
  handleValidationErrors,
  studentController.deleteAccount
);

module.exports = router;
