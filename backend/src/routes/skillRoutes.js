const express = require('express');
const pool = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/skills — list/search skills (requires auth)
router.get(
  '/',
  authenticate,
  catchAsync(async (req, res) => {
    const { q, category, limit = 50 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    let whereClause = '';
    const params = [];

    if (q) {
      whereClause = 'WHERE display_name LIKE ?';
      params.push(`%${q}%`);
    }

    if (category) {
      whereClause += whereClause ? ' AND category = ?' : 'WHERE category = ?';
      params.push(category);
    }

    params.push(String(limitNum));

    const [rows] = await pool.execute(
      `SELECT skill_id, display_name, normalized_name, category
       FROM skill
       ${whereClause}
       ORDER BY display_name
       LIMIT ?`,
      params
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        skillId: r.skill_id,
        displayName: r.display_name,
        normalizedName: r.normalized_name,
        category: r.category,
      })),
    });
  })
);

// GET /api/skills/categories — list categories
router.get(
  '/categories',
  authenticate,
  catchAsync(async (req, res) => {
    const [rows] = await pool.execute(
      'SELECT DISTINCT category FROM skill ORDER BY category'
    );
    res.json({
      success: true,
      data: rows.map((r) => r.category),
    });
  })
);

module.exports = router;
