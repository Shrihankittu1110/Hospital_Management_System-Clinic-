const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const dns = require('dns');
const logger = require('./utils/logger');
const { ApiError } = require('./utils/errors');
const { requestId, securityHeaders, createRateLimiter } = require('./middleware/security');

dotenv.config();

const app = express();
app.disable('x-powered-by');

const PORT = Number(process.env.PORT) || 5000;
const PORT_RETRY_LIMIT = Number(process.env.PORT_RETRY_LIMIT) || 10;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '1mb';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300;
const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/hospital-management';
const MONGO_URI = process.env.MONGO_URI || process.env.DB_URL || DEFAULT_MONGO_URI;
const MONGO_SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000;
const ALLOW_MONGO_FALLBACK = process.env.ALLOW_MONGO_FALLBACK === 'true' || process.env.NODE_ENV !== 'production';
const DNS_SERVERS = (process.env.DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
const DEFAULT_ALLOWED_ORIGINS = [
  'https://hospital-management-system-clinic.vercel.app',
];
const configuredOrigins = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;

if (DNS_SERVERS.length > 0) {
  dns.setServers(DNS_SERVERS);
  logger.info(`Using custom DNS servers: ${DNS_SERVERS.join(', ')}`);
}

// Middleware
app.use(requestId);
app.use(securityHeaders);
app.use(createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
}));
app.use(
  cors({
    origin: "https://hospital-management-system-clinic.vercel.app",
    credentials: true,
  })
);
app.use(express.json({ limit: JSON_BODY_LIMIT }));

// MongoDB connection
if (!process.env.MONGO_URI && !process.env.DB_URL) {
  console.warn(`MONGO_URI is not set. Falling back to ${DEFAULT_MONGO_URI}.`);
}

// Ensure critical secrets are present
if (!process.env.JWT_SECRET) {
  console.error('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

const connectToMongo = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    });
    logger.info('Connected to MongoDB');
    return;
  } catch (primaryError) {
    logger.warn('Primary MongoDB connection failed', primaryError);

    if (MONGO_URI !== DEFAULT_MONGO_URI && ALLOW_MONGO_FALLBACK) {
      logger.warn(`Falling back to ${DEFAULT_MONGO_URI}`);

      try {
        await mongoose.connect(DEFAULT_MONGO_URI, {
          serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
        });
        logger.info('Connected to MongoDB using fallback URI');
        return;
      } catch (fallbackError) {
        logger.error('Fallback MongoDB connection also failed', fallbackError);
      }
    }

    throw primaryError;
  }
};

// Routes
app.use('/api/signup', require('./routes/signup'));
app.use('/api/login', require('./routes/login'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/bills', require('./routes/bill'));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Hospital Management System API',
    status: 'ok',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});

// Register centralized error handler
app.use(require('./middleware/errorHandler'));

let server;

const listenOnConfiguredPort = (port) => new Promise((resolve, reject) => {
  const candidateServer = app.listen(port);

  candidateServer.once('listening', () => {
    server = candidateServer;
    logger.info(`Server is running on port ${port}`);
    resolve(port);
  });

  candidateServer.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      reject(new Error(`Port ${port} is already in use. Stop the process using it or change PORT.`));
      return;
    }

    reject(error);
  });
});

const listenWithRetry = async (initialPort, retryLimit) => {
  let lastError;

  for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
    const candidatePort = initialPort + attempt;

    try {
      return await listenOnConfiguredPort(candidatePort);
    } catch (error) {
      lastError = error;

      if (!/already in use/i.test(error.message) || attempt === retryLimit) {
        throw error;
      }

      logger.warn(`${error.message} Trying port ${candidatePort + 1}.`);
    }
  }

  throw lastError;
};

const closeServer = () => new Promise((resolve, reject) => {
  if (!server) {
    resolve();
    return;
  }

  server.close((error) => {
    if (error) {
      reject(error);
      return;
    }

    resolve();
  });
});

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down backend...`);

  try {
    await closeServer();
    await mongoose.connection.close(false);
    logger.info('Backend shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during backend shutdown', error);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectToMongo();
    await listenWithRetry(PORT, PORT_RETRY_LIMIT);
  } catch (error) {
    logger.error('Unable to start backend', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

startServer();
