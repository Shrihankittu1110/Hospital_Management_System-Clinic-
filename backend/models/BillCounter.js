const mongoose = require('mongoose');

const billCounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 },
}, { timestamps: true });

const BillCounter = mongoose.model('BillCounter', billCounterSchema);

module.exports = BillCounter;