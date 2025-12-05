const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const userService = require("./userService");
const roleService = require("./roleService");
const db = require("./db");
const { secret, refreshSecret, accessTokenExpiresIn, refreshTokenExpiresIn } = require("../config/jwt");
const crypto = require("crypto");

const register = async (email, password, name, tenant_id, roleName, addresses = []) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userService.createUser(email, hashedPassword, name, tenant_id, addresses);

  const role = await roleService.getRoleByName(roleName);
  if (!role) {
    throw createError(400, "Invalid role");
  }

  await roleService.addUserToRole(user.USER_ID, role.ROLE_ID);
  const fullUser = await userService.getUserWithAddresses(user.USER_ID);
  const roles = await roleService.getRolesByUserId(user.USER_ID);
  if (!fullUser) return null;

  const clientUser = userService.mapUserToClient(
    fullUser,
    roles.map((r) => r.NAME || r.name)
  );
  return clientUser;
};

const login = async (email, password, tenant_id) => {
  const user = await userService.getUserByEmailAndTenant(email, tenant_id);
  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.PASSWORD);
  if (!isPasswordValid) {
    throw createError(401, "Invalid email or password");
  }

  const roles = await roleService.getRolesByUserId(user.USER_ID);
  const payload = {
    id: user.USER_ID,
    tenant_id: user.TENANT_ID,
    roles: roles.map((r) => r.NAME),
  };

  const accessToken = jwt.sign(payload, secret, { expiresIn: accessTokenExpiresIn });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: refreshTokenExpiresIn });

  await db.simpleExecute(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)`,
    {
      user_id: user.USER_ID,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  );

  const fullUser = await userService.getUserWithAddresses(user.USER_ID);
  const clientUser = userService.mapUserToClient(
    fullUser,
    roles.map((r) => r.NAME || r.name)
  );

  return { accessToken, refreshToken, user: clientUser };
};

const refreshToken = async (token) => {
  const decoded = jwt.verify(token, refreshSecret);
  const storedToken = await db.simpleExecute("SELECT * FROM refresh_tokens WHERE token = :token", { token });
  if (!storedToken.rows || storedToken.rows.length === 0) {
    throw createError(401, "Invalid refresh token");
  }

  const user = await userService.getUserWithAddresses(decoded.id);
  if (!user) {
    throw createError(401, "Invalid user");
  }

  const roles = await roleService.getRolesByUserId(user.USER_ID);
  const payload = {
    id: user.USER_ID,
    tenant_id: user.TENANT_ID,
    roles: roles.map((r) => r.NAME),
  };

  const accessToken = jwt.sign(payload, secret, { expiresIn: accessTokenExpiresIn });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: refreshTokenExpiresIn });
  await db.simpleExecute(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)`,
    {
      user_id: user.USER_ID,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  );

  return {
    accessToken,
    refreshToken,
    user: userService.mapUserToClient(
      user,
      roles.map((r) => r.NAME)
    ),
  };
};

const forgotPassword = async (email, tenant_id) => {
  const user = await userService.getUserByEmailAndTenant(email, tenant_id);
  if (!user) {
    throw createError(404, "User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await userService.updateUser(user.USER_ID, { resetPasswordToken, resetPasswordExpires });

  console.log(`Password reset token for ${email}: ${resetToken}`);
};

const resetPassword = async (token, password) => {
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await userService.getUserByResetToken(resetPasswordToken);

  if (!user || new Date() > user.RESET_PASSWORD_EXPIRES) {
    throw createError(400, "Password reset token is invalid or has expired");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await userService.updateUser(user.USER_ID, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });
};

const updateProfile = async ({ userId, name, email, password, phone, address, role, tenantId }) => {
  const updates = {};
  const addresses = address ? [address] : [];
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (phone) updates.phone = phone;
  if (role) updates.role = role;
  if (tenantId) updates.tenant_id = tenantId;
  if (password) updates.password = await bcrypt.hash(password, 10);

  const updatedUser = await userService.updateUser(userId, updates);
  for (const addr of addresses) {
    let updatedAddr = addr;
    if (typeof addr === "string") {
      updatedAddr = { line1: addr };
    }
    if (updatedAddr.address_id) {
      await userService.updateAddress(updatedAddr.address_id, updatedAddr);
    } else {
      const tenant_id = updatedUser.TENANT_ID || updatedUser.tenant_id;
      await userService.addAddress(userId, tenant_id, updatedAddr);
    }
  }
  const roles = await roleService.getRolesByUserId(userId);
  const fullUser = await userService.getUserWithAddresses(userId);
  const clientUser = userService.mapUserToClient(
    fullUser,
    roles.map((r) => r.NAME || r.name)
  );
  return clientUser;
};

const addAddressForUser = async (userId, tenant_id, address) => userService.addAddress(userId, tenant_id, address);
const updateAddressForUser = async (addressId, updates) => userService.updateAddress(addressId, updates);
const deleteAddressForUser = async (addressId) => userService.deleteAddress(addressId);

const logout = async (refreshToken) => {
  await db.simpleExecute("DELETE FROM refresh_tokens WHERE token = :token", { token: refreshToken });
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateProfile,
  logout,
  addAddressForUser,
  updateAddressForUser,
  deleteAddressForUser,
};
