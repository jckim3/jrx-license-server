const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  signature: { type: String, required: true }, // ✅ device signature (SHA-256)
  issuedAt: { type: Date, default: Date.now },
  lastChecked: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'blocked', 'expired'],
    default: 'active'
  }
});

// ✅ 한 장치당 한 번만 등록되도록 고유 인덱스 설정
licenseSchema.index({ key: 1, signature: 1 }, { unique: true });

module.exports = mongoose.model('license', licenseSchema);
