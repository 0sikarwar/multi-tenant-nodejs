const createError = require("http-errors");
const tenantService = require("../services/tenantService");

const resolveTenantId = async (req) => {
  const bodyTenant = req && req.body && (req.body.tenant_id || req.body.tenantId || req.body.TENANT_ID);
  if (bodyTenant) return bodyTenant;

  const userTenant = req && req.user && (req.user.tenant_id || req.user.TENANT_ID || req.user.tenantId);
  if (userTenant) return userTenant;

  const domain = (req && (req.hostname || (req.get && req.get("host")))) || "default";
  const tenantName = (domain || "default").split(":")[0];

  let tenant = await tenantService.getTenantByName(tenantName);
  if (!tenant) {
    tenant = await tenantService.createTenant(tenantName);
  }

  const tenantId = tenant && (tenant.TENANT_ID || tenant.tenant_id || tenant.TENANTID || tenant.id);
  if (!tenantId) {
    throw createError(400, "Tenant could not be resolved");
  }

  return tenantId;
};

module.exports = {
  resolveTenantId,
};
