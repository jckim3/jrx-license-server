const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  mac: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  lastChecked: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'blocked', 'expired'],
    default: 'active'
  }
});
licenseSchema.index({ key: 1, mac: 1 }, { unique: true });
module.exports = mongoose.model('license', licenseSchema);
