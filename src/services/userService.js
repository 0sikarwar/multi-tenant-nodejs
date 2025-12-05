const db = require("./db");
const oracledb = require("oracledb");
const roleService = require("./roleService");

const get = (obj, ...keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  return undefined;
};

const mapAddressToClient = (address) => {
  if (!address) return null;
  return {
    id: get(address, "ADDRESS_ID", "address_id"),
    userId: get(address, "USER_ID", "user_id"),
    // tenantId: get(address, "TENANT_ID", "tenant_id"),
    label: get(address, "LABEL", "label"),
    line1: get(address, "LINE1", "line1", "line_1"),
    line2: get(address, "LINE2", "line2", "line_2"),
    city: get(address, "CITY", "city"),
    state: get(address, "STATE", "state"),
    postalCode: get(address, "POSTAL_CODE", "postal_code", "postalCode"),
    country: get(address, "COUNTRY", "country"),
    isPrimary: get(address, "IS_PRIMARY", "is_primary") === 1 || get(address, "IS_PRIMARY", "is_primary") === true,
    createdAt: get(address, "CREATED_AT", "created_at"),
    updatedAt: get(address, "UPDATED_AT", "updated_at"),
  };
};

const createUser = async (email, password, name, tenant_id, addresses = []) => {
  const result = await db.simpleExecute(
    `INSERT INTO users (email, password, name, tenant_id) VALUES (:email, :password, :name, :tenant_id) RETURNING user_id INTO :user_id`,
    {
      email,
      password,
      name,
      tenant_id,
      user_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  const userId = result.outBinds.user_id[0];

  if (Array.isArray(addresses) && addresses.length > 0) {
    for (const addr of addresses) {
      const addrBind = {
        user_id: userId,
        tenant_id,
        label: addr.label || null,
        line1: addr.line1 || addr.line_1 || null,
        line2: addr.line2 || addr.line_2 || null,
        city: addr.city || null,
        state: addr.state || null,
        postal_code: addr.postalCode || addr.postal_code || null,
        country: addr.country || null,
        is_primary: addr.is_primary || addr.isPrimary || 0,
      };

      await db.simpleExecute(
        `INSERT INTO addresses (user_id, tenant_id, label, line1, line2, city, state, postal_code, country, is_primary)
                 VALUES (:user_id, :tenant_id, :label, :line1, :line2, :city, :state, :postal_code, :country, :is_primary)`,
        addrBind
      );
    }
  }

  return { USER_ID: userId, EMAIL: email, NAME: name, TENANT_ID: tenant_id };
};

const getUserByEmailAndTenant = async (email, tenant_id) => {
  const result = await db.simpleExecute("SELECT * FROM users WHERE email = :email AND tenant_id = :tenant_id", {
    email,
    tenant_id,
  });
  return result.rows[0];
};

const getUserById = async (userId) => {
  const result = await db.simpleExecute("SELECT * FROM users WHERE user_id = :userId", { userId });
  return result.rows[0];
};

const getUserWithAddresses = async (userId) => {
  const user = await getUserById(userId);
  if (!user) return null;
  const addresses = await getAddressesByUser(userId);
  return { ...user, addresses };
};

const getUsersByTenant = async (tenant_id, isAdmin) => {
  let query = "SELECT * FROM users WHERE tenant_id = :tenant_id";
  let binds = { tenant_id };
  if (isAdmin) {
    query = "SELECT * FROM users";
    binds = {};
  }
  const result = await db.simpleExecute(query, binds);
  return result.rows;
};

const updateUser = async (userId, updates) => {
  const userUpdates = { ...updates };
  delete userUpdates.role;

  if (updates.role && Object.keys(userUpdates).length > 0) {
    return db.withTransaction(async (connection) => {
      const role = await roleService.getRoleByName(updates.role);
      if (!role) {
        throw new Error("Invalid role");
      }

      const setClauses = Object.keys(userUpdates)
        .map((key) => `${key} = :${key}`)
        .join(", ");
      const binds = { ...userUpdates, userId };

      await connection.execute(`UPDATE users SET ${setClauses} WHERE user_id = :userId`, binds);
      await roleService.updateUserRole(userId, role.ROLE_ID, connection);

      return getUserById(userId);
    });
  }

  if (updates.role) {
    const role = await roleService.getRoleByName(updates.role);
    if (!role) {
      throw new Error("Invalid role");
    }
    await roleService.updateUserRole(userId, role.ROLE_ID);
  } else if (Object.keys(userUpdates).length > 0) {
    const setClauses = Object.keys(userUpdates)
      .map((key) => `${key} = :${key}`)
      .join(", ");
    const binds = { ...userUpdates, userId };
    await db.simpleExecute(`UPDATE users SET ${setClauses} WHERE user_id = :userId`, binds);
  }

  return getUserById(userId);
};

const addAddress = async (userId, tenant_id, address) => {
  const binds = {
    user_id: userId,
    tenant_id,
    label: address.label || null,
    line1: address.line1 || address.line_1 || null,
    line2: address.line2 || address.line_2 || null,
    city: address.city || null,
    state: address.state || null,
    postal_code: address.postalCode || address.postal_code || null,
    country: address.country || null,
    is_primary: address.is_primary || address.isPrimary || 0,
    address_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
  };

  const result = await db.simpleExecute(
    `INSERT INTO addresses (user_id, tenant_id, label, line1, line2, city, state, postal_code, country, is_primary)
         VALUES (:user_id, :tenant_id, :label, :line1, :line2, :city, :state, :postal_code, :country, :is_primary)
         RETURNING address_id INTO :address_id`,
    binds
  );

  return result.outBinds.address_id[0];
};

const getAddressesByUser = async (userId) => {
  const result = await db.simpleExecute(
    "SELECT * FROM addresses WHERE user_id = :userId ORDER BY is_primary DESC, created_at",
    { userId }
  );
  return (result.rows || []).map(mapAddressToClient);
};

const updateAddress = async (addressId, updates) => {
  const keyMap = {
    label: "label",
    line1: "line1",
    line_1: "line1",
    line2: "line2",
    line_2: "line2",
    city: "city",
    state: "state",
    postalCode: "postal_code",
    postal_code: "postal_code",
    country: "country",
    isPrimary: "is_primary",
    is_primary: "is_primary",
    updated_at: "updated_at",
  };

  const mapped = {};
  Object.keys(updates).forEach((k) => {
    if (k in keyMap) mapped[keyMap[k]] = updates[k];
  });

  if (Object.keys(mapped).length === 0) return getAddressesByUser(addressId);

  mapped.updated_at = new Date();

  const setClauses = Object.keys(mapped)
    .map((key) => `${key} = :${key}`)
    .join(", ");
  const binds = { ...mapped, addressId };

  await db.simpleExecute(`UPDATE addresses SET ${setClauses} WHERE address_id = :addressId`, binds);

  const res = await db.simpleExecute("SELECT * FROM addresses WHERE address_id = :addressId", { addressId });
  return mapAddressToClient(res.rows[0]);
};

const deleteAddress = async (addressId) => {
  await db.simpleExecute("DELETE FROM addresses WHERE address_id = :addressId", { addressId });
};

const mapUserToClient = (user, roles = []) => {
  if (!user) return null;

  const id = get(user, "USER_ID", "user_id", "id");
  const name = get(user, "NAME", "name");
  const email = get(user, "EMAIL", "email");
  const tenantId = get(user, "TENANT_ID", "tenant_id", "tenantId");
  const avatar = get(user, "PROFILE_IMAGE_URL", "profile_image_url", "profile_image");
  const phone = get(user, "PHONE", "phone");

  let addressString;
  const rawAddresses = get(user, "addresses", "ADDRESSES");
  let clientAddresses;
  if (Array.isArray(rawAddresses) && rawAddresses.length > 0) {
    clientAddresses = rawAddresses.map(mapAddressToClient);
    const primary = clientAddresses.find((a) => a.isPrimary) || clientAddresses[0];
    if (primary) {
      const parts = [primary.line1, primary.line2, primary.city, primary.state, primary.postalCode, primary.country];
      addressString = parts.filter(Boolean).join(", ");
      addressString = parts.filter(Boolean).join(", ");
    }
  }

  const normalizedRoles = Array.isArray(roles) ? roles : get(user, "roles", "ROLES") || [];
  const role = normalizedRoles.length > 0 ? normalizedRoles[0] : undefined;

  const statusRaw = get(user, "STATUS", "status");
  const status = statusRaw ? String(statusRaw).toLowerCase() : "active";

  return {
    id: id ? String(id) : undefined,
    name: name || undefined,
    email: email || undefined,
    role,
    roles: normalizedRoles,
    tenantId: tenantId ? String(tenantId) : undefined,
    avatar: avatar || undefined,
    profile_image_url: avatar || undefined,
    phone: phone || undefined,
    address: addressString || undefined,
    addresses: clientAddresses || undefined,
    status: status === "inactive" ? "inactive" : "active",
  };
};

const getUserByResetToken = async (token) => {
  const result = await db.simpleExecute("SELECT * FROM users WHERE reset_password_token = :token", { token });
  return result.rows[0];
};

const sanitizeUser = (user, roles) => {
  if (!user) return null;
  const copy = { ...user };
  delete copy.PASSWORD;
  delete copy.password;
  delete copy.RESET_PASSWORD_EXPIRES;
  delete copy.reset_password_expires;
  delete copy.RESET_PASSWORD_TOKEN;
  delete copy.reset_password_token;

  delete copy.TENANT_ID;
  delete copy.tenant_id;

  const normalizedRoles = (roles || []).map((r) => r.NAME || r.name);
  const mapped = mapUserToClient(copy, normalizedRoles);
  return mapped;
};

module.exports = {
  createUser,
  getUserByEmailAndTenant,
  getUserById,
  getUsersByTenant,
  updateUser,
  getUserByResetToken,
  getUserWithAddresses,
  addAddress,
  getAddressesByUser,
  updateAddress,
  deleteAddress,
  sanitizeUser,
  mapUserToClient,
  mapAddressToClient,
};
