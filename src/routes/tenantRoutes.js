
const express = require('express');
const tenantController = require('../controllers/tenantController');
const { auth } = require('../middlewares/auth');
const { rbac } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const { createTenantSchema } = require('../validations/tenantValidation');

const router = express.Router();

router.post('/', auth, rbac(['superadmin']), validate(createTenantSchema), tenantController.createTenant);

module.exports = router;
