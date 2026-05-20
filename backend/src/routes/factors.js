const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { dimension } = req.query;
    let query = 'SELECT * FROM evaluation_factors WHERE is_active = true';
    const params = [];
    if (dimension) {
      params.push(dimension);
      query += ` AND dimension = $${params.length}`;
    }
    query += ' ORDER BY dimension, order_index';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener factores' });
  }
});

module.exports = router;
