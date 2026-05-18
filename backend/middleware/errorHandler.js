const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Server error' });
}

module.exports = errorHandler;
