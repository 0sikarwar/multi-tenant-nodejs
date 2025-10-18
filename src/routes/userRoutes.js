
const express = require('express');
const userController = require('../controllers/userController');
const { auth } = require('../middlewares/auth');
const { rbac } = require('../middlewares/rbac');

const router = express.Router();

router.get('/', auth, rbac(['admin']), userController.getUsers);

module.exports = router;
