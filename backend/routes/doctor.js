const express = require('express');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const Bill = require('../models/Bill');
const {
  DEFAULT_AVAILABILITY,
  getDayRange,
  getWeekday,
  generateTimeSlots,
  parseDisplayTime,
} = require('../utils/appointments');

const router = express.Router();
const doctorOnly = [auth, requireRole('doctor')];

router.get('/profile', doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select('-password');
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.put('/profile', doctorOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, specialty, licenseNumber, phoneNumber } = req.body;
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }
    doctor.firstName = firstName;
    doctor.lastName = lastName;
    doctor.email = email;
    doctor.specialty = specialty;
    doctor.licenseNumber = licenseNumber;
    doctor.phoneNumber = phoneNumber;
    await doctor.save();
    const doctorWithoutPassword = doctor.toObject();
    delete doctorWithoutPassword.password;
    res.json(doctorWithoutPassword);
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const doctors = await Doctor.find().select('firstName lastName specialty');
    res.json(doctors);
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/:doctorId/availability', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId).select('availability');
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }
    res.json(doctor.availability || DEFAULT_AVAILABILITY);
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/patients-with-appointments', doctorOnly, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await Appointment.find({ doctorId }).sort({ date: 1 });
    const patientIds = [...new Set(appointments.map(app => app.patientId.toString()))];
    const now = new Date();

    const patients = await User.find({ _id: { $in: patientIds }, role: 'patient' });

    const patientsWithAppointments = patients.map(patient => {
      const patientAppointments = appointments.filter(app => app.patientId.toString() === patient._id.toString());
      const pastAppointments = patientAppointments.filter(app => new Date(app.date) < now);
      const upcomingAppointments = patientAppointments.filter(app => new Date(app.date) >= now);
      const lastVisit = pastAppointments[pastAppointments.length - 1] || null;
      const nextAppointment = upcomingAppointments[0] || null;

      return {
        ...patient.toObject(),
        lastVisit: lastVisit ? lastVisit.date : null,
        nextAppointment: nextAppointment ? nextAppointment.date : null
      };
    });

    res.json(patientsWithAppointments);
  } catch (error) {
    require('../utils/logger').error('Error fetching patients with appointments:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/available-slots', doctorOnly, async (req, res) => {
  try {
    const { patientId, date } = req.query;
    const doctorId = req.user.id; // Assuming the doctor is making the request

    if (!patientId || !date) {
      return res.json([]);
    }

    const { start, end } = getDayRange(date);

    // Fetch doctor info to check availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }

    const dayOfWeek = getWeekday(date);

    // Fetch booked appointments for the given doctor and date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: start, $lt: end },
      status: 'scheduled'
    });
    const bookedTimes = bookedAppointments.map(app => app.time);

    // Handle doctors without availability data (created before update) - all slots available
    if (!doctor.availability || !doctor.availability[dayOfWeek]) {
      const allTimeSlots = generateTimeSlots('09:00', '17:00');
      const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
      return res.json(availableSlots);
    }

    const doctorAvailability = doctor.availability[dayOfWeek];

    // Check if doctor is available on this day
    if (!doctorAvailability.isAvailable) {
      return res.json([]); // No available slots if doctor is not available
    }

    // Generate time slots based on doctor's working hours
    const allTimeSlots = generateTimeSlots(doctorAvailability.startTime, doctorAvailability.endTime);

    // Filter time slots by booked appointments
    const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));

    res.json(availableSlots);
  } catch (error) {
    require('../utils/logger').error('Error fetching available slots:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.post('/schedule-appointment', doctorOnly, async (req, res) => {
  try {
    const { patientId, date, time, reason } = req.body;
    const doctorId = req.user.id; // Assuming the doctor is making the request

    if (!patientId || !date || !time || !reason) {
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

    const { start, end } = getDayRange(date);
    const dayOfWeek = getWeekday(date);
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }

    if (doctor.availability && doctor.availability[dayOfWeek]) {
      const doctorAvailability = doctor.availability[dayOfWeek];

      if (!doctorAvailability.isAvailable) {
        return res.status(400).send({ error: 'You are not available on this day' });
      }

      const slotTimeStr = parseDisplayTime(time);
      if (!slotTimeStr) {
        return res.status(400).send({ error: 'Invalid time format' });
      }

      if (slotTimeStr < doctorAvailability.startTime || slotTimeStr >= doctorAvailability.endTime) {
        return res.status(400).send({ error: 'Selected time is outside your availability' });
      }
    }

    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: { $gte: start, $lt: end },
      time,
      status: 'scheduled'
    });

    if (existingAppointment) {
      return res.status(409).send({ error: 'Selected time slot is not available' });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      time,
      reason
    });

    await appointment.save();
    res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
  } catch (error) {
    require('../utils/logger').error('Error scheduling appointment:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.post('/prescribe-medication', doctorOnly, async (req, res) => {
  try {
    const { patientId, medication, dosage, frequency } = req.body;
    const doctorId = req.user.id;

    const prescription = new Prescription({
      patientId,
      doctorId,
      medication,
      dosage,
      frequency
    });

    const savedPrescription = await prescription.save();

    res.status(201).json({ message: 'Medication prescribed successfully', prescription: savedPrescription });
  } catch (error) {
    require('../utils/logger').error('Error prescribing medication:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get all prescriptions
router.get('/prescriptions', doctorOnly, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.id });
    res.json(prescriptions);
  } catch (error) {
    require('../utils/logger').error('Error fetching prescriptions:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Update a prescription
router.put('/prescriptions/:id', doctorOnly, async (req, res) => {
  try {
    const { medication, dosage, frequency } = req.body;
    const prescription = await Prescription.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user.id },
      { medication, dosage, frequency },
      { new: true }
    );
    if (!prescription) {
      return res.status(404).send({ error: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    require('../utils/logger').error('Error updating prescription:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get all prescriptions by patient ID
router.get('/prescriptions/:patientId', doctorOnly, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ 
      doctorId: req.user.id,
      patientId: req.params.patientId
    });
    res.json(prescriptions);
  } catch (error) {
    require('../utils/logger').error('Error fetching prescriptions:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Delete a prescription
router.delete('/prescriptions/:id', doctorOnly, async (req, res) => {
  try {
    const prescription = await Prescription.findOneAndDelete({ _id: req.params.id, doctorId: req.user.id });
    if (!prescription) {
      return res.status(404).send({ error: 'Prescription not found' });
    }
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    require('../utils/logger').error('Error deleting prescription:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.delete('/appointments/:appointmentId', doctorOnly, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }

    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).send({ error: 'Unauthorized to cancel this appointment' });
    }

    await Appointment.findByIdAndDelete(appointmentId);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    require('../utils/logger').error('Error cancelling appointment:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/availability', doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select('availability');
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }
    res.json(doctor.availability);
  } catch (error) {
    require('../utils/logger').error('Error fetching availability:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.put('/availability', doctorOnly, async (req, res) => {
  try {
    const { availability } = req.body;
    if (!availability || typeof availability !== 'object') {
      return res.status(400).send({ error: 'Availability is required' });
    }

    const normalizedAvailability = {};
    for (const day of Object.keys(DEFAULT_AVAILABILITY)) {
      const dayAvailability = {
        ...DEFAULT_AVAILABILITY[day],
        ...(availability[day] || {}),
      };

      const validTime = /^\d{2}:\d{2}$/;
      if (!validTime.test(dayAvailability.startTime) || !validTime.test(dayAvailability.endTime)) {
        return res.status(400).send({ error: `Invalid time format for ${day}` });
      }

      if (dayAvailability.isAvailable && dayAvailability.startTime >= dayAvailability.endTime) {
        return res.status(400).send({ error: `Start time must be before end time for ${day}` });
      }

      normalizedAvailability[day] = {
        startTime: dayAvailability.startTime,
        endTime: dayAvailability.endTime,
        isAvailable: Boolean(dayAvailability.isAvailable),
      };
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.id,
      { availability: normalizedAvailability },
      { new: true }
    ).select('availability');
    
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }
    
    res.json({ message: 'Availability updated successfully', availability: doctor.availability });
  } catch (error) {
    require('../utils/logger').error('Error updating availability:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Update appointment status
router.put('/appointments/:appointmentId/status', doctorOnly, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).send({ error: 'Invalid status' });
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found or unauthorized' });
    }

    appointment.status = status;
    await appointment.save();

    // Auto-generate bill when appointment is marked as completed
    if (status === 'completed') {
      try {
        const existingBill = await Bill.findOne({ appointmentId });
        if (!existingBill) {
          const billNumber = await Bill.generateBillNumber();
          const consultationFee = 500;
          const taxRate = 10;

          const bill = new Bill({
            billNumber,
            appointmentId,
            patientId: appointment.patientId,
            doctorId,
            appointmentDate: appointment.date,
            consultationFee,
            taxRate,
            description: 'Consultation Fee',
            notes: `Appointment Reason: ${appointment.reason}`
          });

          await bill.save();
          require('../utils/logger').info(`Bill ${billNumber} auto-generated for appointment ${appointmentId}`);
        }
      } catch (billError) {
        require('../utils/logger').error('Error auto-generating bill:', billError);
        // Don't fail the appointment update if bill generation fails
      }
    }

    res.json({ message: `Appointment marked as ${status}`, appointment });
    } catch (error) {
    require('../utils/logger').error('Error updating appointment status:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get appointments (only active ones - scheduled)
router.get('/appointments', doctorOnly, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await Appointment.find({ 
      doctorId,
      status: 'scheduled'
    })
      .populate('patientId', 'firstName lastName')
      .sort({ date: 1 });
    
    res.json(appointments);
  } catch (error) {
    require('../utils/logger').error('Error fetching appointments:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/history', doctorOnly, async (req, res) => {
  try {
    const doctorId = req.user.id;

    const appointments = await Appointment.find({
      doctorId,
      status: { $in: ['completed', 'cancelled'] }
    })
      .populate('patientId', 'firstName lastName')
      .sort({ date: -1, time: -1 });

    const prescriptions = await Prescription.find({ doctorId })
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ appointments, prescriptions });
  } catch (error) {
    require('../utils/logger').error('Error fetching history:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

module.exports = router;
