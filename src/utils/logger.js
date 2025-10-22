const winston = require("winston");

const customConsole = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  log(info, callback) {
    setImmediate(() => this.emit("logged", info));
    console.log(`${info.level}: ${info.message}`);
    callback();
  },
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(customConsole);
}

module.exports = logger;
