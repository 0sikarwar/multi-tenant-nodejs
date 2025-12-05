const userService = require("../services/userService");
const roleService = require("../services/roleService");
const authService = require("../services/authService");

const getUsers = async (req, res, next) => {
  try {
    const { tenant_id, roles } = req.user;
    const isAdmin = roles.includes("admin");
    const users = await userService.getUsersByTenant(tenant_id, isAdmin);
    const updatedUsers = [];
    for (const user of users) {
      const roles = await roleService.getRolesByUserId(user.USER_ID);
      const clientUser = userService.mapUserToClient(
        user,
        roles.map((r) => r.NAME || r.name)
      );
      updatedUsers.push(clientUser);
    }
    res.json(updatedUsers);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, email, role, tenantId, status } = req.body;
    const user = await authService.updateProfile({
      userId,
      name,
      email,
      role,
      tenantId,
      status,
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
};
