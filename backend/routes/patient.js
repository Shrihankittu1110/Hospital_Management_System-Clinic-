const express = require('express');
const Patient = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const {
  getDayRange,
  getWeekday,
  generateTimeSlots,
  parseDisplayTime,
} = require('../utils/appointments');

const router = express.Router();
const patientOnly = [auth, requireRole('patient')];

router.get('/profile', patientOnly, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select('-password');
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.put('/profile', patientOnly, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    patient.firstName = firstName;
    patient.lastName = lastName;
    patient.email = email;
    await patient.save();
    const patientWithoutPassword = patient.toObject();
    delete patientWithoutPassword.password;
    res.json(patientWithoutPassword);
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.post('/book-appointment', patientOnly, async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    if (!doctorId || !date || !time || !reason) {
      return res.status(400).send({ error: 'All appointment fields are required' });
    }

    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).send({ error: 'Invalid appointment date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return res.status(400).send({ error: 'Appointment date cannot be in the past' });
    }

    // Check if doctor is available on this day
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }

    const dayOfWeek = getWeekday(appointmentDate);
    
    // Handle doctors without availability data (created before update) - allow all times
    if (doctor.availability && doctor.availability[dayOfWeek]) {
      const doctorAvailability = doctor.availability[dayOfWeek];

      if (!doctorAvailability.isAvailable) {
        return res.status(400).send({ error: 'Doctor is not available on this day' });
      }

      // Check if time is within doctor's working hours
      const slotTimeStr = parseDisplayTime(time);
      if (!slotTimeStr) {
        return res.status(400).send({ error: 'Invalid time format' });
      }
      
      const startTime = doctorAvailability.startTime;
      const endTime = doctorAvailability.endTime;
      
      if (slotTimeStr < startTime || slotTimeStr >= endTime) {
        return res.status(400).send({ error: 'Doctor is not available at this time' });
      }
    }

    const { start, end } = getDayRange(date);
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: { $gte: start, $lt: end },
      time,
      status: 'scheduled'
    });

    if (existingAppointment) {
      return res.status(409).send({ error: 'Selected doctor is not available at this time' });
    }

    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      reason
    });
    await appointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.post('/emergency-appointment', patientOnly, async (req, res) => {
  try {
    const {
      doctorId,
      emergencyPriority = 'moderate',
      symptoms,
      contactPhone,
      location,
    } = req.body;

    if (!doctorId || !symptoms?.trim() || !contactPhone?.trim() || !location?.trim()) {
      return res.status(400).send({ error: 'Doctor, symptoms, contact phone, and location are required' });
    }

    if (!['critical', 'high', 'moderate'].includes(emergencyPriority)) {
      return res.status(400).send({ error: 'Invalid emergency priority' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }

    const now = new Date();
    const emergencyTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId,
      date: now,
      time: emergencyTime,
      reason: symptoms.trim(),
      isEmergency: true,
      emergencyPriority,
      emergencyStatus: 'pending',
      symptoms: symptoms.trim(),
      contactPhone: contactPhone.trim(),
      location: location.trim(),
    });

    await appointment.save();
    res.status(201).json({ message: 'Emergency appointment request submitted successfully', appointment });
  } catch (error) {
    require('../utils/logger').error('Error creating emergency appointment:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/available-slots', patientOnly, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.json([]);
    }

    // Check if doctor is available on this day
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }

    const dayOfWeek = getWeekday(date);

    // Handle doctors without availability data (created before update)
    if (!doctor.availability || !doctor.availability[dayOfWeek]) {
      // Default: all slots available for backward compatibility (9 AM to 5 PM)
      const allTimeSlots = generateTimeSlots('09:00', '17:00');
      const { start, end } = getDayRange(date);
      const bookedAppointments = await Appointment.find({
        doctorId,
        date: { $gte: start, $lt: end },
        status: 'scheduled'
      });
      const bookedTimes = bookedAppointments.map(app => app.time);
      const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
      return res.json(availableSlots);
    }

    const doctorAvailability = doctor.availability[dayOfWeek];

    if (!doctorAvailability.isAvailable) {
      return res.json([]); // No available slots if doctor is not available
    }

    // Generate time slots based on doctor's working hours
    const allTimeSlots = generateTimeSlots(doctorAvailability.startTime, doctorAvailability.endTime);
    
    const { start, end } = getDayRange(date);
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: start, $lt: end },
      status: 'scheduled'
    });
    const bookedTimes = bookedAppointments.map(app => app.time);
    const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
    
    res.json(availableSlots);
  } catch (error) {
    require('../utils/logger').error('Error fetching available slots:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/appointments', patientOnly, async (req, res) => {
  try {
    const patientId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const appointments = await Appointment.find({
      patientId,
      date: { $gte: today },
      status: 'scheduled'
    })
      .populate('doctorId', 'firstName lastName')
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    require('../utils/logger').error('Error fetching appointments:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/history', patientOnly, async (req, res) => {
  try {
    const patientId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      patientId,
      $or: [
        { status: { $in: ['completed', 'cancelled'] } },
        { date: { $lt: today } }
      ]
    })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1, time: -1 });

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ createdAt: -1 });

    res.json({ appointments, prescriptions });
  } catch (error) {
    require('../utils/logger').error('Error fetching history:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/care-team', patientOnly, async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = await Appointment.find({ patientId }).distinct('doctorId');
    const careTeam = await Doctor.find({ _id: { $in: appointments } }).select('firstName lastName specialty');
    res.json(careTeam);
  } catch (error) {
    require('../utils/logger').error('Error fetching care team:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/prescriptions', patientOnly, async (req, res) => {
  try {
    const patientId = req.user.id;
    const prescriptions = await Prescription.find({ patientId }).populate('doctorId', 'firstName lastName');
    res.json(prescriptions);
  } catch (error) {
    require('../utils/logger').error('Error fetching prescriptions:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.delete('/appointments/:appointmentId', patientOnly, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user.id) {
      return res.status(403).send({ error: 'Unauthorized to cancel this appointment' });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).send({ error: 'Only scheduled appointments can be cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    require('../utils/logger').error('Error cancelling appointment:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

module.exports = router;
