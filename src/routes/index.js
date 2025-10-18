
const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const tenantRoutes = require('./tenantRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tenants', tenantRoutes);

module.exports = router;
