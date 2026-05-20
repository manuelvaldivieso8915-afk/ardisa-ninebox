const express = require('express');
const r1 = express.Router();
const r2 = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { getByArea, getByQuadrant, exportExcel } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

r1.use(authenticate);
r1.get('/stats', getStats);
module.exports = r1;

// Exportar también reports para el index
r2.use(authenticate);
r2.get('/by-area', getByArea);
r2.get('/by-quadrant', getByQuadrant);
r2.get('/export-excel', exportExcel);
module.exports._reports = r2;
