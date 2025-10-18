const oracledb = require("oracledb");
const dbConfig = require("../config/dbconfig");

const logger = require("../utils/logger");

async function initialize() {
  try {
    const configDir = process.env.TNS_ADMIN;
    console.log("configDir", configDir);
    const libDir = process.env["HOME"] + "/instantclient";
    console.log("libDir", libDir);
    oracledb.autoCommit = true;
    oracledb.initOracleClient({
      libDir,
      configDir,
    });
    await oracledb.createPool(dbConfig);
    logger.info("Database pool started");

    logger.info("Testing database connection...");
    const result = await simpleExecute("SELECT 1 FROM DUAL");
    if (result && result.rows && result.rows.length > 0) {
      logger.info("Database connection successful.", result.rows);
    } else {
      throw new Error("Database connection test failed.");
    }
  } catch (err) {
    logger.error("Error starting database pool:", err);
    throw err;
  }
}

async function close() {
  try {
    await oracledb.getPool().close(10);
    logger.info("Database pool closed");
  } catch (err) {
    logger.error("Error closing database pool:", err);
    throw err;
  }
}

async function simpleExecute(statement, binds = [], opts = {}) {
  let connection;
  let result;
  opts.outFormat = oracledb.OUT_FORMAT_OBJECT;

  try {
    logger.info("Executing SQL", { statement, binds });
    connection = await oracledb.getConnection();
    result = await connection.execute(statement, binds, opts);
    return result;
  } catch (err) {
    logger.error("Error executing query:", err?.message);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logger.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = { initialize, close, simpleExecute };
