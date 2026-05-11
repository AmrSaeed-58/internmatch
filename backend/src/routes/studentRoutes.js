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
    body('gender')
      .optional({ values: 'null' })
      .isLength({ max: 20 })
      .withMessage('Gender must be at most 20 characters'),
    body('dateOfBirth')
      .optional({ values: 'null' })
      .matches(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
      .withMessage('Date of birth must be in YYYY-MM-DD format'),
    body('universityStartDate')
      .optional({ values: 'null' })
      .matches(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
      .withMessage('University start date must be in YYYY-MM-DD format'),
    body('city')
      .optional({ values: 'null' })
      .isLength({ max: 100 })
      .withMessage('City must be at most 100 characters'),
    body('country')
      .optional({ values: 'null' })
      .isLength({ max: 100 })
      .withMessage('Country must be at most 100 characters'),
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
    body('staging.filePath')
      .matches(/^\/uploads\/resumes\/\d+_[0-9a-f-]{36}\.(pdf|docx)$/i)
      .withMessage('Invalid staged file path'),
    body('staging.fileType')
      .optional({ values: 'null' })
      .isIn(['pdf', 'docx'])
      .withMessage('File type must be pdf or docx'),
    body('staging.originalFilename')
      .optional({ values: 'null' })
      .isLength({ max: 255 })
      .withMessage('Original filename must be at most 255 characters'),
    body('skills')
      .optional({ values: 'null' })
      .isArray()
      .withMessage('Skills must be an array'),
    body('skills.*')
      .custom((value) => {
        if (!value || typeof value !== 'object') {
          throw new Error('Each skill must be an object');
        }
        const hasId = value.skillId !== undefined && value.skillId !== null && value.skillId !== '';
        const hasName = typeof value.skillName === 'string' && value.skillName.trim().length > 0;
        if (!hasId && !hasName) {
          throw new Error('Each skill must include skillId or skillName');
        }
        return true;
      }),
    body('skills.*.skillId')
      .optional({ values: 'null' })
      .isInt({ min: 1 })
      .withMessage('skillId must be a positive integer'),
    body('skills.*.skillName')
      .optional({ values: 'null' })
      .isLength({ min: 1, max: 100 })
      .withMessage('skillName must be 1–100 characters'),
    body('skills.*.category')
      .optional({ values: 'null' })
      .isIn(['programming', 'web', 'data', 'ai_ml', 'devops', 'mobile', 'design', 'soft_skill', 'other'])
      .withMessage('Invalid skill category'),
    body('skills.*.proficiencyLevel')
      .optional({ values: 'null' })
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Proficiency must be beginner, intermediate, or advanced'),
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

router.get('/invitations', studentController.getInvitations);
router.put(
  '/invitations/:id/viewed',
  [param('id').isInt().withMessage('Invalid invitation ID')],
  handleValidationErrors,
  studentController.markInvitationViewed
);
router.put(
  '/invitations/:id/dismiss',
  [param('id').isInt().withMessage('Invalid invitation ID')],
  handleValidationErrors,
  studentController.dismissInvitation
);

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
