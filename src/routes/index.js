
const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const tenantRoutes = require('./tenantRoutes');
const roleRoutes = require('./roleRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tenants', tenantRoutes);
router.use('/roles', roleRoutes);

module.exports = router;
