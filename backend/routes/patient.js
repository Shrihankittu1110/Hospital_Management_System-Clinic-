const express = require('express');
const Patient = require('../models/User');
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');

const router = express.Router();

const getDayRange = (dateValue) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Invalid token' });
  }
};

router.get('/profile', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select('-password');
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
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
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.post('/book-appointment', auth, async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    if (!doctorId || !date || !time || !reason) {
      return res.status(400).send({ error: 'All appointment fields are required' });
    }

    // Check if doctor is available on this day
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Handle doctors without availability data (created before update) - allow all times
    if (doctor.availability && doctor.availability[dayOfWeek]) {
      const doctorAvailability = doctor.availability[dayOfWeek];

      if (!doctorAvailability.isAvailable) {
        return res.status(400).send({ error: 'Doctor is not available on this day' });
      }

      // Check if time is within doctor's working hours
      const [timeStr, period] = time.split(' ');
      if (!timeStr || !period) {
        return res.status(400).send({ error: 'Invalid time format' });
      }
      
      const [hours, minutes] = timeStr.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      const slotTimeStr = `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
      
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
      time
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
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/available-slots', auth, async (req, res) => {
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

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Helper function to generate time slots from 24-hour format to 12-hour format
    const generateTimeSlots = (startTime, endTime) => {
      const slots = [];
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const hour12 = currentHour % 12 || 12;
        const period = currentHour >= 12 ? 'PM' : 'AM';
        const slot = `${hour12}:${String(currentMin).padStart(2, '0')} ${period}`;
        slots.push(slot);
        
        currentMin += 60; // Add 1 hour
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
      return slots;
    };

    // Handle doctors without availability data (created before update)
    if (!doctor.availability || !doctor.availability[dayOfWeek]) {
      // Default: all slots available for backward compatibility (9 AM to 5 PM)
      const allTimeSlots = generateTimeSlots('09:00', '17:00');
      const { start, end } = getDayRange(date);
      const bookedAppointments = await Appointment.find({
        doctorId,
        date: { $gte: start, $lt: end }
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
      date: { $gte: start, $lt: end }
    });
    const bookedTimes = bookedAppointments.map(app => app.time);
    const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
    
    res.json(availableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/appointments', auth, async (req, res) => {
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
    console.error('Error fetching appointments:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/history', auth, async (req, res) => {
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
    console.error('Error fetching history:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/care-team', auth, async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = await Appointment.find({ patientId }).distinct('doctorId');
    const careTeam = await Doctor.find({ _id: { $in: appointments } }).select('firstName lastName specialty');
    res.json(careTeam);
  } catch (error) {
    console.error('Error fetching care team:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/prescriptions', auth, async (req, res) => {
  try {
    const patientId = req.user.id;
    const prescriptions = await Prescription.find({ patientId }).populate('doctorId', 'firstName lastName');
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.delete('/appointments/:appointmentId', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user.id) {
      return res.status(403).send({ error: 'Unauthorized to cancel this appointment' });
    }

    await Appointment.findByIdAndDelete(appointmentId);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

module.exports = router;
