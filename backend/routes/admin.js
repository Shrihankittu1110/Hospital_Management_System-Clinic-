const express = require('express');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(auth, requireRole('admin'));

router.post('/add-doctor', async (req, res) => {
  const { firstName, lastName, email, specialty, licenseNumber, phoneNumber, password } = req.body;

  try {
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !specialty?.trim() || !licenseNumber?.trim() || !phoneNumber?.trim() || !password) {
      return res.status(400).send({ error: 'All doctor fields are required' });
    }

    if (/\s/.test(password)) {
      return res.status(400).send({ error: 'Password cannot contain spaces' });
    }

    const doctor = new Doctor({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      specialty: specialty.trim(),
      licenseNumber: licenseNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      password
    });
    await doctor.save();
    res.status(201).send({ message: 'Doctor added successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({ error: 'Email or license number already exists' });
    }
    res.status(400).send({ error: error.message });
  }
});

router.post('/add-admin', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return res.status(400).send({ error: 'First name, last name, email, and password are required' });
    }

    if (/\s/.test(password)) {
      return res.status(400).send({ error: 'Password cannot contain spaces' });
    }

    const admin = new Admin({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password
    });
    await admin.save();
    res.status(201).send({ message: 'Admin added successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({ error: 'Email already exists' });
    }
    res.status(400).send({ error: error.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).send({ error: 'Admin not found' });
    }
    res.json(admin);
    } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).send({ error: 'Admin not found' });
    }
    admin.firstName = firstName;
    admin.lastName = lastName;
    admin.email = email;
    await admin.save();
    const adminWithoutPassword = admin.toObject();
    delete adminWithoutPassword.password;
    res.json({ message: 'Profile updated successfully', admin: adminWithoutPassword });
  } catch (error) {
    require('../utils/logger').error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/total-doctors', async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments();
    res.json({ totalDoctors });
  } catch (error) {
    require('../utils/logger').error('Error fetching total doctors:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/total-patients', async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    res.json({ totalPatients });
  } catch (error) {
    require('../utils/logger').error('Error fetching total patients:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/doctor-overview', async (req, res) => {
  try {
    const doctors = await Doctor.find().select('firstName lastName specialty');
    const doctorOverview = await Promise.all(doctors.map(async (doctor) => {
      const uniquePatients = await Appointment.distinct('patientId', { doctorId: doctor._id });
      return {
        name: `${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.specialty,
        patients: uniquePatients.length
      };
    }));
    res.json(doctorOverview);
  } catch (error) {
    require('../utils/logger').error('Error fetching doctor overview:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/patient-overview', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('firstName lastName');
    const patientOverview = await Promise.all(patients.map(async (patient) => {
      const appointmentCount = await Appointment.countDocuments({ patientId: patient._id });
      return {
        name: `${patient.firstName} ${patient.lastName}`,
        appointments: appointmentCount
      };
    }));
    res.json(patientOverview);
  } catch (error) {
    require('../utils/logger').error('Error fetching patient overview:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get all appointments (admin only)
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'scheduled' })
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    require('../utils/logger').error('Error fetching appointments:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Update appointment status (admin only)
router.put('/appointments/:appointmentId/status', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).send({ error: 'Invalid status' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

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
            doctorId: appointment.doctorId,
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
      }
    }

    res.json({ message: `Appointment marked as ${status}`, appointment });
  } catch (error) {
    require('../utils/logger').error('Error updating appointment status:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

module.exports = router;
