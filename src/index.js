require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const createError = require("http-errors");
const routes = require("./routes");
const errorHandler = require("./middlewares/error");
const logger = require("./utils/logger");
const db = require("./services/db");
const path = require("path");

process.env.TNS_ADMIN = path.resolve(process.env.WALLET_LOCATION || "./wallet");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOriginEnv = process.env.CORS_ORIGIN || "";
let corsOptions = {};
if (corsOriginEnv) {
  const origins = corsOriginEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
} else if (process.env.NODE_ENV === "development") {
  corsOptions = { origin: true };
} else {
  corsOptions = { origin: false };
}

app.use(cors(corsOptions));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1", routes);

app.use((req, res, next) => {
  next(createError(404, "Not Found"));
});

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
