const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ── Dashboard ────────────────────────────────────────────────────────────────────
router.get('/dashboard-stats', adminController.getDashboardStats);

// ── User Management ──────────────────────────────────────────────────────────────
router.get('/users', adminController.getUsers);

router.get('/users/:id',
  param('id').isInt().withMessage('Invalid user ID'),
  handleValidationErrors,
  adminController.getUserById
);

router.put('/users/:id',
  param('id').isInt().withMessage('Invalid user ID'),
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  handleValidationErrors,
  adminController.updateUser
);

router.put('/users/:id/toggle-active',
  param('id').isInt().withMessage('Invalid user ID'),
  handleValidationErrors,
  adminController.toggleUserActive
);

router.delete('/users/:id',
  param('id').isInt().withMessage('Invalid user ID'),
  handleValidationErrors,
  adminController.deleteUser
);

// ── Internship Management ────────────────────────────────────────────────────────
router.get('/internships', adminController.getInternships);

router.put('/internships/:id/approve',
  param('id').isInt().withMessage('Invalid internship ID'),
  handleValidationErrors,
  adminController.approveInternship
);

router.put('/internships/:id/reject',
  param('id').isInt().withMessage('Invalid internship ID'),
  body('note').optional().trim().isLength({ max: 1000 }).withMessage('Note too long'),
  handleValidationErrors,
  adminController.rejectInternship
);

router.delete('/internships/:id',
  param('id').isInt().withMessage('Invalid internship ID'),
  handleValidationErrors,
  adminController.deleteInternship
);

// ── System Logs ──────────────────────────────────────────────────────────────────
router.get('/logs', adminController.getLogs);
router.get('/logs/export', adminController.exportLogs);

// ── Reports ──────────────────────────────────────────────────────────────────────
router.post('/reports/generate',
  body('reportType').notEmpty().withMessage('Report type is required'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  handleValidationErrors,
  adminController.generateReport
);

router.get('/reports/export', adminController.exportReport);

// ── Notifications ────────────────────────────────────────────────────────────────
router.get('/notifications', adminController.getNotifications);

router.put('/notifications/:id/read',
  param('id').isInt().withMessage('Invalid notification ID'),
  handleValidationErrors,
  adminController.markNotificationRead
);

router.put('/notifications/read-all', adminController.markAllNotificationsRead);

// ── Change Password ──────────────────────────────────────────────────────────────
router.put('/change-password',
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  handleValidationErrors,
  adminController.changePassword
);

module.exports = router;
