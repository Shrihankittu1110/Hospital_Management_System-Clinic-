const mongoose = require('mongoose');
const BillCounter = require('./BillCounter');

const billSchema = new mongoose.Schema({
  billNumber: { type: String, unique: true, required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }, // Optional
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentDate: { type: Date, required: true },
  consultationFee: { type: Number, required: true, default: 500 },
  taxRate: { type: Number, required: true, default: 10 }, // Tax percentage
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  description: { type: String, default: 'Consultation Fee' },
  notes: { type: String },
  upiId: { type: String }, // Patient's UPI ID for payment
  paidDate: { type: Date }, // Date when bill was paid
  transactionId: { type: String }, // UPI transaction ID
}, { timestamps: true });

// Auto-calculate taxAmount and totalAmount before saving
billSchema.pre('save', function(next) {
  const consultationFee = Number(this.consultationFee) || 500;
  const taxRate = Number(this.taxRate) || 10;

  // Always calculate tax and total
  this.taxAmount = (consultationFee * taxRate) / 100;
  this.totalAmount = consultationFee + this.taxAmount;

  if (!this.dueDate) {
    // Set due date to 30 days from issue date
    this.dueDate = new Date(this.issueDate);
    this.dueDate.setDate(this.dueDate.getDate() + 30);
  }
  next();
});

// Generate unique bill number
billSchema.statics.generateBillNumber = async function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const counter = await BillCounter.findOneAndUpdate(
    { name: 'bill-number' },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `BILL-${year}${month}-${String(counter.sequence).padStart(5, '0')}`;
};

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
