const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config({ override: true });

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/hospital-management';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;

if (!process.env.MONGO_URI) {
  console.warn(`MONGO_URI is not set. Falling back to ${DEFAULT_MONGO_URI}.`);
}

mongoose.connect(MONGO_URI)
  .then(() => require('./utils/logger').info('Connected to MongoDB'))
  .catch((err) => {
          require('./utils/logger').error('Could not connect to MongoDB', err);
    process.exit(1);
  });

async function createAdmin() {
  const admin = new Admin({
    firstName: "Admin",
    lastName: "One",
    email: "admin1@gmail.com",
    password: "admin1", 
    role: "admin"
  });

  try {
    await admin.save();
    require('./utils/logger').info('Admin created successfully');
  } catch (error) {
      require('./utils/logger').error('Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
