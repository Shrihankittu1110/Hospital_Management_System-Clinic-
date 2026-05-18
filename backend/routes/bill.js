const express = require('express');
const Bill = require('../models/Bill');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const auth = require('../middleware/auth');

const router = express.Router();

const normalizeBillPaymentStatus = (bill, paymentStatus) => {
  bill.paymentStatus = paymentStatus;

  if (paymentStatus === 'paid') {
    if (!bill.paidDate) {
      bill.paidDate = new Date();
    }
    return;
  }

  bill.paidDate = undefined;
  bill.upiId = undefined;
  bill.transactionId = undefined;
};

// Generate bill for a completed appointment (Only doctors based on prescription)
router.post('/generate', auth, async (req, res) => {
  try {
    const { prescriptionId, appointmentId, consultationFee } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only doctors can generate bills
    if (userRole !== 'doctor') {
      return res.status(403).send({ error: 'Only doctors can generate bills' });
    }

    if (!appointmentId) {
      return res.status(400).send({ error: 'Appointment ID is required' });
    }

    // Fetch appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName');

    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }

    // Verify appointment is for the doctor requesting the bill
    if (appointment.doctorId._id.toString() !== userId.toString()) {
      return res.status(403).send({ error: 'This appointment is not for you' });
    }

    // Fetch prescription if prescriptionId is provided
    let prescription = null;
    let prescriptionNotes = '';
    
    if (prescriptionId) {
      prescription = await Prescription.findById(prescriptionId);
      if (prescription) {
        // Verify doctor is the one who prescribed it
        if (prescription.doctorId.toString() !== userId.toString()) {
          return res.status(403).send({ error: 'Only the prescribing doctor can generate bill for this prescription' });
        }

        // Verify prescription is for the same patient
        if (prescription.patientId.toString() !== appointment.patientId._id.toString()) {
          return res.status(400).send({ error: 'Prescription does not match this appointment' });
        }

        prescriptionNotes = `Prescription: ${prescription.medication} - ${prescription.dosage} (${prescription.frequency})`;
      }
    }

    // Check if bill already exists for this appointment
    const existingBill = await Bill.findOne({ appointmentId });
    if (existingBill) {
      return res.status(409).send({ error: 'Bill already generated for this appointment' });
    }

    // Generate bill
    const billNumber = await Bill.generateBillNumber();
    const fee = consultationFee || 500; // Default fee
    const tax = 10; // Default 10% tax

    const billData = {
      billNumber,
      appointmentId,
      patientId: appointment.patientId._id,
      doctorId: userId,
      appointmentDate: appointment.date,
      consultationFee: fee,
      taxRate: tax,
      description: `Consultation Fee - Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
      notes: prescriptionNotes || `Appointment Reason: ${appointment.reason}`
    };

    // Add prescriptionId if provided
    if (prescriptionId) {
      billData.prescriptionId = prescriptionId;
    }

    const bill = new Bill(billData);
    await bill.save();

    const populatedBill = await Bill.findById(bill._id)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialty')
      .populate('prescriptionId');

    res.status(201).json({
      message: 'Bill generated successfully',
      bill: populatedBill
    });
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).send({ error: error.message || 'Server error' });
  }
});

// Get all bills for a doctor
router.get('/doctor/bills', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;

    if (req.user.role !== 'doctor') {
      return res.status(403).send({ error: 'Only doctors can view their bills' });
    }

    const bills = await Bill.find({ doctorId })
      .populate('patientId', 'firstName lastName email')
      .populate('appointmentId', 'date time reason')
      .sort({ issueDate: -1 });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching doctor bills:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get specific bill details
router.get('/:billId', auth, async (req, res) => {
  try {
    const { billId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const bill = await Bill.findById(billId)
      .populate('patientId')
      .populate('doctorId')
      .populate('appointmentId');

    if (!bill) {
      return res.status(404).send({ error: 'Bill not found' });
    }

    // Verify authorization
    if (userRole === 'patient' && bill.patientId._id.toString() !== userId) {
      return res.status(403).send({ error: 'Unauthorized to view this bill' });
    }
    if (userRole === 'doctor' && bill.doctorId._id.toString() !== userId) {
      return res.status(403).send({ error: 'Unauthorized to view this bill' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill details:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Update bill payment status
router.put('/:billId/payment-status', auth, async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentStatus } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['unpaid', 'paid', 'partial'].includes(paymentStatus)) {
      return res.status(400).send({ error: 'Invalid payment status' });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).send({ error: 'Bill not found' });
    }

    // Only patient or doctor can update payment status (or admin)
    if (userRole === 'patient' && bill.patientId.toString() !== userId) {
      return res.status(403).send({ error: 'Unauthorized' });
    }
    if (userRole === 'doctor' && bill.doctorId.toString() !== userId) {
      return res.status(403).send({ error: 'Unauthorized' });
    }

    normalizeBillPaymentStatus(bill, paymentStatus);
    await bill.save();

    if (userRole === 'doctor' && paymentStatus === 'paid') {
      const appointment = await Appointment.findById(bill.appointmentId);
      if (appointment && appointment.status !== 'completed') {
        appointment.status = 'completed';
        await appointment.save();
      }
    }

    const populatedBill = await Bill.findById(bill._id)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialty')
      .populate('prescriptionId');

    res.json({ message: 'Payment status updated', bill: populatedBill });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get bill statistics for doctor (revenue overview)
router.get('/doctor/stats/overview', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;

    if (req.user.role !== 'doctor') {
      return res.status(403).send({ error: 'Only doctors can view their statistics' });
    }

    const totalBills = await Bill.countDocuments({ doctorId });
    const paidBills = await Bill.countDocuments({ doctorId, paymentStatus: 'paid' });
    const unpaidBills = await Bill.countDocuments({ doctorId, paymentStatus: 'unpaid' });

    const totalRevenue = await Bill.aggregate([
      { $match: { doctorId: require('mongoose').Types.ObjectId(doctorId), paymentStatus: 'paid' } },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const pendingRevenue = await Bill.aggregate([
      { $match: { doctorId: require('mongoose').Types.ObjectId(doctorId), paymentStatus: 'unpaid' } },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalBills,
      paidBills,
      unpaidBills,
      totalRevenue: totalRevenue[0]?.totalAmount || 0,
      pendingRevenue: pendingRevenue[0]?.totalAmount || 0
    });
  } catch (error) {
    console.error('Error fetching doctor statistics:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Patient pays bill with UPI ID
router.post('/:billId/pay-with-upi', auth, async (req, res) => {
  try {
    const { billId } = req.params;
    const { upiId, transactionId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only patients can pay bills
    if (userRole !== 'patient') {
      return res.status(403).send({ error: 'Only patients can pay bills' });
    }

    if (!upiId || !transactionId) {
      return res.status(400).send({ error: 'UPI ID and Transaction ID are required' });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).send({ error: 'Bill not found' });
    }

    // Verify the bill belongs to the patient
    if (bill.patientId.toString() !== userId) {
      return res.status(403).send({ error: 'Unauthorized to pay this bill' });
    }

    // Verify bill is not already paid
    if (bill.paymentStatus === 'paid') {
      return res.status(400).send({ error: 'Bill is already paid' });
    }

    // Update bill with UPI payment details
    bill.upiId = upiId;
    bill.transactionId = transactionId;
    normalizeBillPaymentStatus(bill, 'paid');
    await bill.save();

    res.json({
      message: 'Bill paid successfully with UPI',
      bill: await bill.populate('patientId', 'firstName lastName email').populate('doctorId', 'firstName lastName specialty').populate('prescriptionId')
    });
  } catch (error) {
    console.error('Error processing UPI payment:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get patient's bills with payment details
router.get('/patient/my-bills', auth, async (req, res) => {
  try {
    const patientId = req.user.id;

    if (req.user.role !== 'patient') {
      return res.status(403).send({ error: 'Only patients can view their bills' });
    }

    const bills = await Bill.find({ patientId })
      .populate('doctorId', 'firstName lastName specialty')
      .populate('prescriptionId', 'medication dosage frequency')
      .populate('appointmentId', 'date time reason')
      .sort({ issueDate: -1 });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching patient bills:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Delete bill (only doctor can delete their own bills)
router.delete('/:billId', auth, async (req, res) => {
  try {
    const { billId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only doctors can delete bills
    if (userRole !== 'doctor') {
      return res.status(403).send({ error: 'Only doctors can delete bills' });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).send({ error: 'Bill not found' });
    }

    // Verify the bill belongs to the doctor
    if (bill.doctorId.toString() !== userId) {
      return res.status(403).send({ error: 'Unauthorized to delete this bill' });
    }

    // Prevent deletion of paid bills
    if (bill.paymentStatus === 'paid') {
      return res.status(400).send({ error: 'Cannot delete a paid bill' });
    }

    await Bill.findByIdAndDelete(billId);

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

module.exports = router;
