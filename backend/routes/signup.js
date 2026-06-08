const express = require('express');
const User = require('../models/User');
const { asyncHandler, ApiError } = require('../utils/errors');

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, 'First name, last name, email, and password are required');
  }

  if (!/\S/.test(password)) {
    throw new ApiError(400, 'Password must contain at least one character');
  }

  const user = new User({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    password,
    role: 'patient'
  });
  await user.save();
  res.status(201).send({ message: 'User registered successfully' });
}));

module.exports = router;
