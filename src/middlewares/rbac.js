
const createError = require('http-errors');

const rbac = (allowedRoles) => {
    return (req, res, next) => {
        const { roles } = req.user;
        const hasAccess = roles.some(role => allowedRoles.includes(role));

        if (!hasAccess) {
            return next(createError(403, 'Forbidden: You do not have the required role'));
        }

        next();
    };
};

module.exports = { rbac };
