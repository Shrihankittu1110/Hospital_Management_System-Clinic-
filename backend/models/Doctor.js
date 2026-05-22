const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  specialty: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, unique: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  role: { type: String, enum: ['doctor'], default: 'doctor' },
  availability: {
    type: {
      monday: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true }
      },
      tuesday: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true }
      },
      wednesday: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true }
      },
      thursday: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true }
      },
      friday: {
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true }
      },
      saturday: {
        startTime: { type: String, default: '10:00' },
        endTime: { type: String, default: '14:00' },
        isAvailable: { type: Boolean, default: false }
      },
      sunday: {
        startTime: { type: String, default: '00:00' },
        endTime: { type: String, default: '00:00' },
        isAvailable: { type: Boolean, default: false }
      }
    },
    default: {
      monday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
      tuesday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
      wednesday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
      thursday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
      friday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
      saturday: { startTime: '10:00', endTime: '14:00', isAvailable: false },
      sunday: { startTime: '00:00', endTime: '00:00', isAvailable: false }
    }
  }
});

doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
