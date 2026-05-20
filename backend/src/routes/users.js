// users.js
const express = require('express');
const usersRouter = express.Router();
const { getAll, create, update, remove } = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

usersRouter.use(authenticate, requireAdmin);
usersRouter.get('/', getAll);
usersRouter.post('/', create);
usersRouter.put('/:id', update);
usersRouter.delete('/:id', remove);

module.exports = usersRouter;
