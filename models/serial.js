const mongoose = require('mongoose');

const serialSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  hospital: String,
  country: String,
  company: String,
  software: String,
  available: Number,
  type: String,
  memo: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'suspended'],
    default: 'active'
  },
  licenseCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('serial', serialSchema);
