
const userService = require('../services/userService');

const getUsers = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        const users = await userService.getUsersByTenant(tenant_id);
        res.json(users);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers
};
