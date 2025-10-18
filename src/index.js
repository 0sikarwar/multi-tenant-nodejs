require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
const routes = require("./routes");
const errorHandler = require("./middlewares/error");
const logger = require("./utils/logger");
const db = require("./services/db");
const path = require("path");

process.env.TNS_ADMIN = path.resolve(process.env.WALLET_LOCATION || "./wallet");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/v1", routes);

// 404 Handler
app.use((req, res, next) => {
  next(createError(404, "Not Found"));
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

let server;

async function startup() {
  try {
    logger.info("Initializing database...");
    await db.initialize();
    logger.info("Database initialized.");

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

startup();

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await db.close();
      logger.info("Database connection closed.");
    } catch (err) {
      logger.error("Error closing database connection:", err);
    }
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
