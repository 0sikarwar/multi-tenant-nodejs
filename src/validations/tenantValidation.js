
const Joi = require('joi');

const createTenantSchema = Joi.object({
    name: Joi.string().required()
});

module.exports = {
    createTenantSchema
};
