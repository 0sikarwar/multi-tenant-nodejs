const tenantService = require("../services/tenantService");

const createTenant = async (req, res, next) => {
  try {
    const { name } = req.body;
    const tenant = await tenantService.createTenant(name);
    res.status(201).json(tenant);
  } catch (error) {
    next(error);
  }
};

const getAllTenants = async (req, res, next) => {
  try {
    const tenants = await tenantService.getAllTenants();
    res.status(200).json(tenants);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTenant,
  getAllTenants,
};
