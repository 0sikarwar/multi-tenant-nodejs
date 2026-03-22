const db = require("./db");

const getRoleByName = async (name) => {
  const result = await db.simpleExecute("SELECT * FROM roles WHERE name = :name", { name });
  return result.rows[0];
};

const addUserToRole = async (userId, roleId) => {
  return db.simpleExecute("INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)", { userId, roleId });
};

const getRolesByUserId = async (userId) => {
  const result = await db.simpleExecute(
    "SELECT r.name, r.role_id FROM roles r JOIN user_roles ur ON r.role_id = ur.role_id WHERE ur.user_id = :userId",
    { userId }
  );
  return result.rows;
};

const getPermissionsByUserId = async (userId) => {
  const result = await db.simpleExecute(
    `SELECT DISTINCT p.name 
     FROM permissions p
     JOIN role_permissions rp ON p.permission_id = rp.permission_id
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = :userId`,
    { userId }
  );
  return (result.rows || []).map(r => r.NAME || r.name);
};

const getPermissionsByRoleName = async (roleName) => {
  const result = await db.simpleExecute(
    `SELECT p.name 
     FROM permissions p
     JOIN role_permissions rp ON p.permission_id = rp.permission_id
     JOIN roles r ON rp.role_id = r.role_id
     WHERE r.name = :roleName`,
    { roleName }
  );
  return (result.rows || []).map(r => r.NAME || r.name);
};

const updateUserRole = async (userId, roleId, connection) => {
  const execute = connection ? (stmt, binds) => connection.execute(stmt, binds) : db.simpleExecute;
  await execute("DELETE FROM user_roles WHERE user_id = :userId", { userId });
  return execute("INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)", { userId, roleId });
};

module.exports = {
  getRoleByName,
  addUserToRole,
  getRolesByUserId,
  updateUserRole,
  getPermissionsByUserId,
  getPermissionsByRoleName,
};
