const Joi = require("joi");

const createTenantSchema = Joi.object({
  name: Joi.string().optional(),
});

module.exports = {
  createTenantSchema,
};
