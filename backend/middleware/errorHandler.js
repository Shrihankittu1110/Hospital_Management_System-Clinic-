const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || (err.name === 'ValidationError' ? 400 : 500);
  const response = {
    error: status >= 500 ? 'Server error' : err.message,
    requestId: req.id,
  };

  if (err.code === 11000) {
    response.error = 'Duplicate value already exists';
  }

  if (err.name === 'CastError') {
    response.error = 'Invalid ID format';
  }

  logger.error('Request failed', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    message: err.message,
    stack: err.stack,
  });

  res.status(status).json(response);
}

module.exports = errorHandler;
