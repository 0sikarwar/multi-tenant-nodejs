const express = require("express");
const roleController = require("../controllers/roleController");
const { auth } = require("../middlewares/auth");
const { rbac } = require("../middlewares/rbac");

const router = express.Router();
// Only admins can manage roles and permissions
router.use(auth);
router.use(rbac(["admin"]));

router.get("/roles", roleController.getAllRoles);
router.get("/permissions", roleController.getAllPermissions);

router.post("/roles", roleController.createRole);
router.put("/roles/:id", roleController.updateRole);

router.post("/permissions", roleController.createPermission);
router.put("/permissions/:id", roleController.updatePermission);

router.post("/roles/assign-permission", roleController.assignPermissionToRole);
router.post("/roles/remove-permission", roleController.removePermissionFromRole);

module.exports = router;
