const express = require('express');
const router = express.Router();
const { getByArea, getByQuadrant, exportExcel } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/by-area', getByArea);
router.get('/by-quadrant', getByQuadrant);
router.get('/export-excel', exportExcel);

module.exports = router;
