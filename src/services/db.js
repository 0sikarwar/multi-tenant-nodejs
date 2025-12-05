const oracledb = require("oracledb");
const dbConfig = require("../config/dbconfig");

const logger = require("../utils/logger");
const { parseOracleError } = require("../utils/dbErrorHandler");

async function initialize() {
  try {
    const configDir = process.env.TNS_ADMIN;
    const libDir = process.env["HOME"] + "/instantclient";
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
    console.log({ statement, binds });
    logger.info("Executing SQL", { statement, binds });
    connection = await oracledb.getConnection();
    result = await connection.execute(statement, binds, opts);
    return result;
  } catch (err) {
    logger.error(`Error executing query: ${err.message || err.toString()}`);
    parseOracleError(err);
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

async function withTransaction(callback) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    // In Node-oracledb's default auto-commit mode, we must explicitly begin a transaction
    // which we can do by simply turning auto-commit off for the connection.
    // But since we have it globally on, we will just commit/rollback manually.
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    logger.error(`Transaction failed, rolling back: ${err.message || err.toString()}`);
    if (connection) {
      parseOracleError(err);
      await connection.rollback();
    }
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = { initialize, close, simpleExecute, withTransaction };
