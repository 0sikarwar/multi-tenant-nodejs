const createError = require("http-errors");

const rbac = (allowedRoles) => {
  return (req, res, next) => {
    const { roles } = req.user;
    const hasAccess = roles.some((role) => allowedRoles.includes(role));

    if (!hasAccess) {
      return next(createError(403, "Forbidden: You do not have the required role"));
    }

    next();
  };
};

const checkUserOrAdmin = (req, res, next) => {
  const { id: loggedInUserId, roles } = req.user;
  const { userId: targetUserId } = req.params;

  if (roles.includes("admin") || String(loggedInUserId) === String(targetUserId)) {
    return next();
  }

  return next(createError(403, "Forbidden: You do not have permission to perform this action"));
};

const maybeAuthThenRbac = (allowedRoles) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return rbac(allowedRoles)(req, res, next);
  // auth(req, res, (err) => {
  //   if (err) return next(err);
  // });
};

module.exports = { rbac, maybeAuthThenRbac, checkUserOrAdmin };
