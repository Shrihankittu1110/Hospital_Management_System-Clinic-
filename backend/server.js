const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Add this line

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/hospital-management';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;

// Middleware
app.use(cors()); 
app.use(express.json());

// MongoDB connection
if (!process.env.MONGO_URI) {
  console.warn(`MONGO_URI is not set. Falling back to ${DEFAULT_MONGO_URI}.`);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Could not connect to MongoDB', err);
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
