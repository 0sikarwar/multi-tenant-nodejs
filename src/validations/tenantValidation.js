const Joi = require("joi");

const createTenantSchema = Joi.object({
  name: Joi.string().optional(),
});

const updateTenantSchema = Joi.object({
  name: Joi.string().optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

module.exports = {
  createTenantSchema,
  updateTenantSchema,
};
