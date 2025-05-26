const express = require('express');
const router = express.Router();
const License = require('../models/license.js');
const Serial = require('../models/serial.js');

function generateSerialKey(company, software) {
  const prefix = `${company}-${software}`.toUpperCase().replace(/\s/g, '');
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

// ✅ 라이선스 유효성 체크
// GET /api/check?key=...&mac=...
router.get('/check', async (req, res) => {
  const key = (req.query.key || '').trim();
  const mac = (req.query.mac || '').trim();

  if (!key || !mac) return res.status(400).send('Missing key or mac');

  const license = await License.findOne({ key, mac });
  if (!license) return res.status(403).send('Invalid license');

  const serial = await Serial.findOne({ key });
  if (!serial) return res.status(403).send('Serial not found');

  if (serial.status !== 'active') return res.status(403).send(`Serial status: ${serial.status}`);
  if (serial.expiresAt && new Date() > serial.expiresAt)
    return res.status(403).send('Serial expired');

  license.lastChecked = new Date();
  await license.save();

  res.send('✅ License valid');
});

// ✅ 라이선스 등록
// POST /api/register
router.post('/register', async (req, res) => {
  const { key, mac } = req.body;

  if (!key || !mac) return res.status(400).send('❌ Missing key or mac');

  const serial = await Serial.findOne({ key });
  if (!serial) return res.status(403).send('❌ Invalid or unissued serial key');

  // 상태 및 만료일 확인
  if (serial.status !== 'active') return res.status(403).send(`❌ Serial status: ${serial.status}`);
  if (serial.expiresAt && new Date() > serial.expiresAt)
    return res.status(403).send('❌ Serial expired');

  // 이미 같은 MAC이 등록되어 있으면 통과
  const existing = await License.findOne({ key, mac });
  if (existing) return res.status(200).send('✅ Already registered');

  // 등록된 장비 수 초과 여부 확인
  const count = await License.countDocuments({ key });
  if (serial.available !== undefined && count >= serial.available)
    return res.status(409).send('❌ License limit exceeded');

  // 등록
  try {
    const newLicense = new License({ key, mac, lastChecked: new Date() });
    await newLicense.save();

    // licenseCount 업데이트
    await Serial.updateOne({ key }, { $inc: { licenseCount: 1 } });

    return res.status(201).send('✅ License registered');
  } catch (err) {
    return res.status(500).send('❌ Server error: ' + err.message);
  }
});

// ✅ 시리얼 등록
router.post('/serials', async (req, res) => {
  const { hospital, country, company, software, available, type, memo } = req.body;
  if (!company || !software) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const key = generateSerialKey(company, software);

  try {
    const serial = new Serial({
      key,
      hospital,
      country,
      company,
      software,
      available,
      type,
      memo,
      status: 'active',
      licenseCount: 0,
    });

    await serial.save();
    res.json({ success: true, serial: key });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 시리얼 목록 + licenseCount 포함
router.get('/serials', async (req, res) => {
  try {
    const serials = await Serial.find().sort({ createdAt: -1 });

    // 각 시리얼에 대해 licenseCount 갱신 (optional: remove if already maintained)
    const updated = await Promise.all(
      serials.map(async (serial) => {
        const count = await License.countDocuments({ key: serial.key });
        return { ...serial.toObject(), licenseCount: count };
      })
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 시리얼 수정 (예: expiresAt 변경)
router.put('/serials/:id', async (req, res) => {
  const { id } = req.params;
  const { expiresAt } = req.body;

  try {
    const updated = await Serial.findByIdAndUpdate(
      id,
      { expiresAt: expiresAt ? new Date(expiresAt) : null },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Serial not found' });
    }

    res.json({ success: true, serial: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
