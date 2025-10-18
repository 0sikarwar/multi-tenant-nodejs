
const db = require('./db');

const createUser = async (email, password, name, tenant_id) => {
    const result = await db.simpleExecute(
        `INSERT INTO users (email, password, name, tenant_id) VALUES (:email, :password, :name, :tenant_id) RETURNING user_id INTO :user_id`,
        {
            email,
            password,
            name,
            tenant_id,
            user_id: { type: 2001, dir: 3003 }
        }
    );
    const userId = result.outBinds.user_id[0];
    return { USER_ID: userId, EMAIL: email, NAME: name, TENANT_ID: tenant_id };
};

const getUserByEmailAndTenant = async (email, tenant_id) => {
    const result = await db.simpleExecute(
        'SELECT * FROM users WHERE email = :email AND tenant_id = :tenant_id',
        { email, tenant_id }
    );
    return result.rows[0];
};

const getUserById = async (userId) => {
    const result = await db.simpleExecute('SELECT * FROM users WHERE user_id = :userId', { userId });
    return result.rows[0];
};

const getUsersByTenant = async (tenant_id) => {
    const result = await db.simpleExecute('SELECT user_id, email, name FROM users WHERE tenant_id = :tenant_id', { tenant_id });
    return result.rows;
};

const updateUser = async (userId, updates) => {
    const setClauses = Object.keys(updates).map((key, i) => `${key} = :${key}`).join(', ');
    const binds = { ...updates, userId };

    const result = await db.simpleExecute(
        `UPDATE users SET ${setClauses} WHERE user_id = :userId`,
        binds
    );

    return getUserById(userId);
};

const getUserByResetToken = async (token) => {
    const result = await db.simpleExecute(
        'SELECT * FROM users WHERE reset_password_token = :token',
        { token }
    );
    return result.rows[0];
};

module.exports = {
    createUser,
    getUserByEmailAndTenant,
    getUserById,
    getUsersByTenant,
    updateUser,
    getUserByResetToken
};
