const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler, ApiError } = require('../utils/errors');

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email?.trim() || !password || !role) {
    throw new ApiError(400, 'Email, password, and role are required');
  }

  if (/\s/.test(password)) {
    throw new ApiError(400, 'Password cannot contain spaces');
  }

  if (!['patient', 'doctor', 'admin'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  let user;
  if (role === 'doctor') {
    user = await Doctor.findOne({ email: email.trim() });
  } else if (role === 'admin') {
    user = await Admin.findOne({ email: email.trim() });
  } else {
    user = await User.findOne({ email: email.trim(), role });
  }

  if (!user) {
    throw new ApiError(400, 'Invalid email, password, or role');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Invalid email, password, or role');
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.send({ token, role: user.role });
}));

module.exports = router;
