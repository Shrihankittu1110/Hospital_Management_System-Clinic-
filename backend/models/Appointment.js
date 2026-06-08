const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  isEmergency: { type: Boolean, default: false },
  emergencyPriority: {
    type: String,
    enum: ['critical', 'high', 'moderate'],
    default: 'moderate'
  },
  emergencyStatus: {
    type: String,
    enum: ['pending', 'triaged', 'in-care', 'resolved'],
    default: 'pending'
  },
  symptoms: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
  location: { type: String, trim: true }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
