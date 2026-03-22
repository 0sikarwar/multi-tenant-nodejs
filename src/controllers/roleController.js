const roleService = require("../services/roleService");

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await roleService.getAllPermissions();
    res.json(permissions);
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name } = req.body;
    const role = await roleService.createRole(name);
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const role = await roleService.updateRole(id, name);
    res.json(role);
  } catch (error) {
    next(error);
  }
};

const createPermission = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const permission = await roleService.createPermission(name, description);
    res.status(201).json(permission);
  } catch (error) {
    next(error);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const permission = await roleService.updatePermission(id, { name, description });
    res.json(permission);
  } catch (error) {
    next(error);
  }
};

const assignPermissionToRole = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.body;
    await roleService.assignPermissionToRole(roleId, permissionId);
    res.json({ message: "Permission assigned to role successfully" });
  } catch (error) {
    next(error);
  }
};

const removePermissionFromRole = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.body;
    await roleService.removePermissionFromRole(roleId, permissionId);
    res.json({ message: "Permission removed from role successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getAllPermissions,
  createRole,
  updateRole,
  createPermission,
  updatePermission,
  assignPermissionToRole,
  removePermissionFromRole,
};
