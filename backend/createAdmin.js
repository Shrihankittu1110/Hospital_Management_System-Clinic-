const mongoose = require('mongoose');
const dns = require('dns');
const Admin = require('./models/Admin');
const logger = require('./utils/logger');
require('dotenv').config();

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/hospital-management';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;
const MONGO_SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000;
const DEFAULT_ADMIN = {
  firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
  lastName: process.env.ADMIN_LAST_NAME || 'One',
  email: process.env.ADMIN_EMAIL || 'admin1@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'admin1',
  role: 'admin',
};
const RESET_ADMIN_PASSWORD = process.env.RESET_ADMIN_PASSWORD === 'true';
const DNS_SERVERS = (process.env.DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (DNS_SERVERS.length > 0) {
  dns.setServers(DNS_SERVERS);
  logger.info(`Using custom DNS servers: ${DNS_SERVERS.join(', ')}`);
}

if (!process.env.MONGO_URI) {
  console.warn(`MONGO_URI is not set. Falling back to ${DEFAULT_MONGO_URI}.`);
}

async function createAdmin() {
  const existingAdmin = await Admin.findOne({ email: DEFAULT_ADMIN.email });
  if (existingAdmin) {
    existingAdmin.firstName = DEFAULT_ADMIN.firstName;
    existingAdmin.lastName = DEFAULT_ADMIN.lastName;

    if (RESET_ADMIN_PASSWORD) {
      existingAdmin.password = DEFAULT_ADMIN.password;
    }

    await existingAdmin.save();
    logger.info(RESET_ADMIN_PASSWORD ? 'Admin updated and password reset' : 'Admin already exists, profile refreshed');
    return;
  }

  const admin = new Admin(DEFAULT_ADMIN);

  await admin.save();
  logger.info('Admin created successfully');
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    });
    logger.info('Connected to MongoDB');

    await createAdmin();
  } catch (error) {
    logger.error('Error creating admin', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
