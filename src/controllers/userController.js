const userService = require("../services/userService");
const roleService = require("../services/roleService");

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

module.exports = {
  getUsers,
};
