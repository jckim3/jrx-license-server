const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  mac: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  lastChecked: { type: Date, default: Date.now }
});

module.exports = mongoose.model('License', licenseSchema);
