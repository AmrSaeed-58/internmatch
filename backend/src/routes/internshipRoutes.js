const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const internshipController = require('../controllers/internshipController');

// GET /api/internships/featured  (public — no auth)
router.get('/featured', internshipController.getFeatured);

// GET /api/internships/stats     (public — no auth)
router.get('/stats', internshipController.getStats);

// GET /api/internships           (optional auth — match scores for students)
router.get('/', optionalAuth, internshipController.listInternships);

// GET /api/internships/:id       (optional auth — personalization + access rules)
router.get('/:id', optionalAuth, internshipController.getInternship);

module.exports = router;
