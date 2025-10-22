const Joi = require("joi");

const addressSchema = Joi.object({
  label: Joi.string().max(100).optional(),
  line1: Joi.string().max(255).required(),
  line2: Joi.string().max(255).allow(null, "").optional(),
  city: Joi.string().max(100).allow(null, "").optional(),
  state: Joi.string().max(100).allow(null, "").optional(),
  postalCode: Joi.string().max(50).allow(null, "").optional(),
  postal_code: Joi.string().max(50).allow(null, "").optional(),
  country: Joi.string().max(100).allow(null, "").optional(),
  is_primary: Joi.number().valid(0, 1).optional(),
});

module.exports = { addressSchema };
