
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { secret } = require('../config/jwt');

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(createError(401, 'Authorization header is missing'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return next(createError(401, 'Token is missing'));
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        next(createError(401, 'Invalid token'));
    }
};

module.exports = { auth };
