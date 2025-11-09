const express = require("express");
const tenantController = require("../controllers/tenantController");
const { auth } = require("../middlewares/auth");
const { rbac } = require("../middlewares/rbac");
const validate = require("../middlewares/validate");
const { createTenantSchema } = require("../validations/tenantValidation");
const { updateTenantSchema } = require("../validations/tenantValidation");

const router = express.Router();

router.post("/", auth, rbac(["admin"]), validate(createTenantSchema), tenantController.createTenant);
router.get("/", auth, rbac(["admin"]), tenantController.getAllTenants);
router.put("/:id", auth, rbac(["admin"]), validate(updateTenantSchema), tenantController.updateTenant);

module.exports = router;
