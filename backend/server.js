const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Add this line

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/hospital-management';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://hospital-management-system-clinic-4.vercel.app',
];
const configuredOrigins = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// MongoDB connection
if (!process.env.MONGO_URI) {
  console.warn(`MONGO_URI is not set. Falling back to ${DEFAULT_MONGO_URI}.`);
}

// Ensure critical secrets are present
if (!process.env.JWT_SECRET) {
  console.error('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => require('./utils/logger').info('Connected to MongoDB'))
  .catch((err) => {
    require('./utils/logger').error('Could not connect to MongoDB', err);
    process.exit(1);
  });

// Routes
app.use('/api/signup', require('./routes/signup'));
app.use('/api/login', require('./routes/login'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/bills', require('./routes/bill'));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Hospital Management System API');
});

// Register centralized error handler
app.use(require('./middleware/errorHandler'));

app.listen(PORT, () => {
  require('./utils/logger').info(`Server is running on port ${PORT}`);
});
