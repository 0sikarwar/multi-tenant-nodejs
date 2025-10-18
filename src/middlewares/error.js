
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err);

    const status = err.status || 500;
    const message = err.message || 'Something went wrong';

    res.status(status).json({
        status,
        message
    });
};

module.exports = errorHandler;
