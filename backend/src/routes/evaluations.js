const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, getNineBoxMatrix } = require('../controllers/evaluationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/ninebox-matrix', getNineBoxMatrix);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);

module.exports = router;
