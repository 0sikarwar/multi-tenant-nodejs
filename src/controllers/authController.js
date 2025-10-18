
const createError = require('http-errors');
const authService = require('../services/authService');
const userService = require('../services/userService');
const tenantService = require('../services/tenantService');

const register = async (req, res, next) => {
    try {
        const { email, password, name, tenant_id, role } = req.body;

        const tenantExists = await tenantService.getTenantById(tenant_id);
        if (!tenantExists) {
            throw createError(400, 'Invalid tenant_id');
        }

        const existingUser = await userService.getUserByEmailAndTenant(email, tenant_id);
        if (existingUser) {
            throw createError(400, 'User with this email already exists for this tenant');
        }

        const user = await authService.register(email, password, name, tenant_id, role);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password, tenant_id } = req.body;
        const data = await authService.login(email, password, tenant_id);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw createError(400, 'Refresh token is required');
        }
        const data = await authService.refreshToken(refreshToken);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email, tenant_id } = req.body;
        await authService.forgotPassword(email, tenant_id);
        res.json({ message: 'Password reset token sent to your email' });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);
        res.json({ message: 'Password has been reset' });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { name, email, password } = req.body;
        const user = await authService.updateProfile(id, name, email, password);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
    updateProfile,
    logout
};
