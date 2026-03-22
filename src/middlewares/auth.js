const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { secret } = require("../config/jwt");
const db = require("../services/db");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(createError(401, "Authorization header is missing"));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(createError(401, "Token is missing"));
  }

  try {
    const decoded = jwt.verify(token, secret);
    const tenant_id = decoded.tenant_id;
    if (tenant_id) {
      try {
        const tenant = await db.simpleExecute("SELECT status FROM tenants WHERE tenant_id = :tenant_id", { tenant_id });
        if (!tenant.rows[0] || tenant.rows[0].STATUS === "inactive" || tenant.rows[0].status === "inactive") {
          return next(createError(403, "Tenant is deactivated. Access denied."));
        }
      } catch (dbError) {
        return next(createError(500, "Error verifying tenant status."));
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(createError(401, "Invalid token"));
  }
};

module.exports = { auth };
