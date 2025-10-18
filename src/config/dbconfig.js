module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMax: 44,
  poolMin: 2,
  poolIncrement: 0,
};
