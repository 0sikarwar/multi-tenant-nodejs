const db = require("./db");
const oracledb = require("oracledb");

const mapRoleToClient = (role, permissionIds = []) => {
  if (!role) return null;
  return {
    id: String(role.ROLE_ID || role.role_id),
    name: role.NAME || role.name,
    permissionIds: (permissionIds || []).map(String),
  };
};

const mapPermissionToClient = (permission) => {
  if (!permission) return null;
  return {
    id: String(permission.PERMISSION_ID || permission.permission_id),
    name: permission.NAME || permission.name,
    description: permission.DESCRIPTION || permission.description,
  };
};

const getRolePermissions = async (roleId) => {
  const result = await db.simpleExecute(
    "SELECT permission_id FROM role_permissions WHERE role_id = :roleId",
    { roleId }
  );
  return (result.rows || []).map(r => r.PERMISSION_ID || r.permission_id);
};

const getRoleByName = async (name) => {
  const result = await db.simpleExecute("SELECT * FROM roles WHERE name = :name", { name });
  if (!result.rows[0]) return null;
  const role = result.rows[0];
  const roleId = role.ROLE_ID || role.role_id;
  const permissionIds = await getRolePermissions(roleId);
  return mapRoleToClient(role, permissionIds);
};

const getAllRoles = async () => {
  const rolesResult = await db.simpleExecute("SELECT * FROM roles ORDER BY name");
  const roles = rolesResult.rows || [];
  
  const enrichedRoles = [];
  for (const role of roles) {
    const roleId = role.ROLE_ID || role.role_id;
    const permissionIds = await getRolePermissions(roleId);
    enrichedRoles.push(mapRoleToClient(role, permissionIds));
  }
  return enrichedRoles;
};

const getAllPermissions = async () => {
  const result = await db.simpleExecute("SELECT * FROM permissions ORDER BY name");
  return (result.rows || []).map(mapPermissionToClient);
};

const addUserToRole = async (userId, roleId) => {
  return db.simpleExecute("INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)", { userId, roleId });
};

const getRolesByUserId = async (userId) => {
  const result = await db.simpleExecute(
    "SELECT r.name, r.role_id FROM roles r JOIN user_roles ur ON r.role_id = ur.role_id WHERE ur.user_id = :userId",
    { userId }
  );
  const roles = result.rows || [];
  const enrichedRoles = [];
  for (const role of roles) {
    const roleId = role.ROLE_ID || role.role_id;
    const permissionIds = await getRolePermissions(roleId);
    enrichedRoles.push(mapRoleToClient(role, permissionIds));
  }
  return enrichedRoles;
};

const getPermissionsByUserId = async (userId) => {
  const result = await db.simpleExecute(
    `SELECT DISTINCT p.* 
     FROM permissions p
     JOIN role_permissions rp ON p.permission_id = rp.permission_id
     JOIN user_roles ur ON rp.role_id = ur.role_id
     WHERE ur.user_id = :userId`,
    { userId }
  );
  return (result.rows || []).map(mapPermissionToClient);
};

const getPermissionsByRoleName = async (roleName) => {
  const result = await db.simpleExecute(
    `SELECT p.* 
     FROM permissions p
     JOIN role_permissions rp ON p.permission_id = rp.permission_id
     JOIN roles r ON rp.role_id = r.role_id
     WHERE r.name = :roleName`,
    { roleName }
  );
  return (result.rows || []).map(mapPermissionToClient);
};

const updateUserRole = async (userId, roleId, connection) => {
  const execute = connection ? (stmt, binds) => connection.execute(stmt, binds) : db.simpleExecute;
  await execute("DELETE FROM user_roles WHERE user_id = :userId", { userId });
  return execute("INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)", { userId, roleId });
};

const createRole = async (name) => {
  const result = await db.simpleExecute(
    `INSERT INTO roles (name) VALUES (:name) RETURNING role_id INTO :role_id`,
    {
      name,
      role_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  return mapRoleToClient({ ROLE_ID: result.outBinds.role_id[0], NAME: name }, []);
};

const updateRole = async (roleId, name) => {
  await db.simpleExecute("UPDATE roles SET name = :name WHERE role_id = :roleId", { name, roleId });
  const permissionIds = await getRolePermissions(roleId);
  return mapRoleToClient({ ROLE_ID: roleId, NAME: name }, permissionIds);
};

const createPermission = async (name, description) => {
  const result = await db.simpleExecute(
    `INSERT INTO permissions (name, description) VALUES (:name, :description) RETURNING permission_id INTO :permission_id`,
    {
      name,
      description,
      permission_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  return mapPermissionToClient({ PERMISSION_ID: result.outBinds.permission_id[0], NAME: name, DESCRIPTION: description });
};

const updatePermission = async (permissionId, { name, description }) => {
  const sets = [];
  const binds = { permissionId };
  if (name) {
    sets.push("name = :name");
    binds.name = name;
  }
  if (description) {
    sets.push("description = :description");
    binds.description = description;
  }
  if (sets.length > 0) {
    await db.simpleExecute(`UPDATE permissions SET ${sets.join(", ")} WHERE permission_id = :permissionId`, binds);
  }
  
  const res = await db.simpleExecute("SELECT * FROM permissions WHERE permission_id = :permissionId", { permissionId });
  return mapPermissionToClient(res.rows[0]);
};

const assignPermissionToRole = async (roleId, permissionId) => {
  return db.simpleExecute("INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permissionId)", {
    roleId,
    permissionId,
  });
};

const removePermissionFromRole = async (roleId, permissionId) => {
  return db.simpleExecute("DELETE FROM role_permissions WHERE role_id = :roleId AND permission_id = :permissionId", {
    roleId,
    permissionId,
  });
};

module.exports = {
  mapRoleToClient,
  mapPermissionToClient,
  getRoleByName,
  getAllRoles,
  getAllPermissions,
  addUserToRole,
  getRolesByUserId,
  updateUserRole,
  getPermissionsByUserId,
  getPermissionsByRoleName,
  createRole,
  updateRole,
  createPermission,
  updatePermission,
  assignPermissionToRole,
  removePermissionFromRole,
};
