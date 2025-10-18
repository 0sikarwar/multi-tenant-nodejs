
const db = require('./db');

const createTenant = async (name) => {
    const result = await db.simpleExecute(
        `INSERT INTO tenants (name) VALUES (:name) RETURNING tenant_id INTO :tenant_id`,
        {
            name,
            tenant_id: { type: 2001, dir: 3003 }
        }
    );
    const tenantId = result.outBinds.tenant_id[0];
    return { TENANT_ID: tenantId, NAME: name, STATUS: 'active' };
};

const getTenantById = async (tenantId) => {
    const result = await db.simpleExecute('SELECT * FROM tenants WHERE tenant_id = :tenantId', { tenantId });
    return result.rows[0];
};

module.exports = {
    createTenant,
    getTenantById
};
