const db = require("./db");
const oracledb = require("oracledb");

const mapTenantToClient = (tenant) => {
  if (!tenant) return null;

  const id = tenant.TENANT_ID || tenant.tenant_id;
  const name = tenant.NAME || tenant.name;
  const statusRaw = tenant.STATUS || tenant.status;
  const status = statusRaw ? String(statusRaw).toLowerCase() : "active";

  return {
    id: id ? String(id) : undefined,
    name: name || undefined,
    status: status === "inactive" ? "inactive" : "active",
  };
};

const createTenant = async (name) => {
  const result = await db.simpleExecute(
    `INSERT INTO tenants (name) VALUES (:name) RETURNING tenant_id INTO :tenant_id`,
    {
      name,
      tenant_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  const tenantId = result.outBinds.tenant_id[0];
  return mapTenantToClient({ TENANT_ID: tenantId, NAME: name, STATUS: "active" });
};

const getTenantByName = async (name) => {
  const result = await db.simpleExecute("SELECT * FROM tenants WHERE name = :name", { name });
  return mapTenantToClient(result.rows[0]);
};

const getTenantById = async (tenantId) => {
  const result = await db.simpleExecute("SELECT * FROM tenants WHERE tenant_id = :tenantId", { tenantId });
  return mapTenantToClient(result.rows[0]);
};

const getAllTenants = async () => {
  const result = await db.simpleExecute("SELECT * FROM tenants ORDER BY tenant_id");
  return (result.rows || []).map(mapTenantToClient);
};

const updateTenant = async (tenantId, { name, status } = {}) => {
  const sets = [];
  const binds = { tenantId };

  if (typeof name !== "undefined") {
    sets.push("name = :name");
    binds.name = name;
  }

  if (typeof status !== "undefined") {
    sets.push("status = :status");
    binds.status = status;
  }

  if (sets.length === 0) {
    return getTenantById(tenantId);
  }

  const stmt = `UPDATE tenants SET ${sets.join(", ")} WHERE tenant_id = :tenantId`;
  await db.simpleExecute(stmt, binds);

  return getTenantById(tenantId);
};

module.exports = {
  createTenant,
  getTenantById,
  getAllTenants,
  getTenantByName,
  updateTenant,
  mapTenantToClient,
};
