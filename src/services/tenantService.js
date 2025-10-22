const db = require("./db");
const oracledb = require("oracledb");

const createTenant = async (name) => {
  const result = await db.simpleExecute(
    `INSERT INTO tenants (name) VALUES (:name) RETURNING tenant_id INTO :tenant_id`,
    {
      name,
      tenant_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
    }
  );
  const tenantId = result.outBinds.tenant_id[0];
  return { TENANT_ID: tenantId, NAME: name, STATUS: "active" };
};

const getTenantByName = async (name) => {
  const result = await db.simpleExecute("SELECT * FROM tenants WHERE name = :name", { name });
  return result.rows[0];
};

const getTenantById = async (tenantId) => {
  const result = await db.simpleExecute("SELECT * FROM tenants WHERE tenant_id = :tenantId", { tenantId });
  return result.rows[0];
};

const getAllTenants = async () => {
  const result = await db.simpleExecute("SELECT * FROM tenants ORDER BY tenant_id");
  return result.rows;
};

module.exports = {
  createTenant,
  getTenantById,
  getAllTenants,
  getTenantByName,
};
