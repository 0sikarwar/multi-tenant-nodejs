const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const userService = require("./userService");
const mailService = require("./mailService");
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
    roles.map((r) => r.NAME || r.name),
  );
  return clientUser;
};

const login = async (email, password, tenant_id) => {
  const tenant = await db.simpleExecute("SELECT status FROM tenants WHERE tenant_id = :tenant_id", { tenant_id });
  if (!tenant.rows[0] || tenant.rows[0].STATUS === "inactive" || tenant.rows[0].status === "inactive") {
    throw createError(403, "Tenant is deactivated. Please contact support.");
  }

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
    },
  );

  const fullUser = await userService.getUserWithAddresses(user.USER_ID);
  const clientUser = userService.mapUserToClient(
    fullUser,
    roles.map((r) => r.NAME || r.name),
  );

  return { accessToken, refreshToken, user: clientUser };
};

const refreshToken = async (token) => {
  const decoded = jwt.verify(token, refreshSecret);
  const tenant_id = decoded.tenant_id;

  const tenant = await db.simpleExecute("SELECT status FROM tenants WHERE tenant_id = :tenant_id", { tenant_id });
  if (!tenant.rows[0] || tenant.rows[0].STATUS === "inactive" || tenant.rows[0].status === "inactive") {
    throw createError(403, "Tenant is deactivated. Please contact support.");
  }

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
    },
  );

  return {
    accessToken,
    refreshToken,
    user: userService.mapUserToClient(
      user,
      roles.map((r) => r.NAME),
    ),
  };
};

const forgotPassword = async (email, tenant_id, origin) => {
  const user = await userService.getUserByEmailAndTenant(email, tenant_id);
  if (!user) {
    throw createError(404, "User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await userService.updateUser(user.USER_ID, {
    reset_password_token: resetPasswordToken,
    reset_password_expires: resetPasswordExpires,
  });

  const resetUrl = `${origin}/reset-password?token=${resetToken}`;
  const message = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #f9f9f9; }
        .header { text-align: center; margin-bottom: 20px; }
        .content { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .button { display: inline-block; padding: 12px 24px; color: #fff !important; background-color: #007bff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.85em; color: #777; }
        .link { color: #007bff; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Reset Request</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
          <p>Please click the button below to complete the process:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p>This link is only valid for 10 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #999;">If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
          <p class="link">${resetUrl}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await mailService.sendMail(email, "Password reset", message, html);
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
    reset_password_token: null,
    reset_password_expires: null,
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
    roles.map((r) => r.NAME || r.name),
  );
  return clientUser;
};

const addAddressForUser = async (userId, tenant_id, address) => userService.addAddress(userId, tenant_id, address);
const updateAddressForUser = async (addressId, updates) => userService.updateAddress(addressId, updates);
const deleteAddressForUser = async (addressId) => userService.deleteAddress(addressId);

const logout = async (refreshToken) => {
  await db.simpleExecute("DELETE FROM refresh_tokens WHERE token = :token", { token: refreshToken });
};

const checkPageAccess = async (userId, pageName) => {
  // Simple mapping of pages to required permissions or roles
  const pagePermissions = {
    "admin-dashboard": ["admin"],
    "user-profile": ["user", "admin"],
    "tenant-settings": ["admin"],
    "audit-logs": ["admin"],
  };

  const requiredRoles = pagePermissions[pageName];
  if (!requiredRoles) {
    // If page is not in the map, assume it's public or check if it exists
    return true;
  }

  const userRoles = await roleService.getRolesByUserId(userId);
  const userRoleNames = userRoles.map((r) => r.NAME || r.name);

  const hasAccess = userRoleNames.some((role) => requiredRoles.includes(role));

  // Optionally check permissions as well
  const userPermissions = await roleService.getPermissionsByUserId(userId);
  // If we had specific permissions like 'view_audit_logs', we would check them here

  return hasAccess;
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
  checkPageAccess,
};
