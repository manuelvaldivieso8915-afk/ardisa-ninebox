const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/employeeController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
