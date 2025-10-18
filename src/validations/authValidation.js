
const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    tenant_id: Joi.number().integer().required(),
    role: Joi.string().valid('admin', 'user').required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    tenant_id: Joi.number().integer().required()
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    tenant_id: Joi.number().integer().required()
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
});

const updateProfileSchema = Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6)
}).min(1);

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema
};
