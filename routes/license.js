const express = require('express');
const router = express.Router();
const License = require('../models/license.js');
const Serial = require('../models/serial.js'); // 추가


function generateSerialKey(company, software) {
  const prefix = `${company}-${software}`.toUpperCase().replace(/\s/g, '');
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

// GET /api/check?key=...&mac=...
router.get('/check', async (req, res) => {
  const key = (req.query.key || '').trim();
  const mac = (req.query.mac || '').trim();

  if (!key || !mac) return res.status(400).send('Missing key or mac');

  const license = await License.findOne({ key, mac });
  if (!license) return res.status(403).send('Invalid license');

  license.lastChecked = new Date();
  await license.save();

  res.send('Valid');
});

// POST /api/register


// POST /api/register (JRXViewer에서 시리얼 인증 요청)
router.post('/register', async (req, res) => {
  const { key, mac } = req.body;

  if (!key || !mac) {
    return res.status(400).send('❌ Missing key or mac');
  }

  // 1. 시리얼 키가 존재하는지 확인
  const serial = await Serial.findOne({ key });
  if (!serial) {
    return res.status(403).send('❌ Invalid or unissued serial key');
  }

  // 2. 동일 key + mac 이 이미 등록되어 있으면 통과
  const existing = await License.findOne({ key, mac });
  if (existing) {
    return res.status(200).send('✅ Already registered');
  }

  // 3. 동일 key 로 다른 MAC 이 등록되어 있으면 거부
  const conflict = await License.findOne({ key });
  if (conflict) {
    return res.status(409).send('❌ This key is already used on another device');
  }

  // 4. 최초 등록 (정상 처리)
  try {
    const newLicense = new License({ key, mac, lastChecked: new Date() });
    await newLicense.save();
    return res.status(201).send('✅ License registered');
  } catch (err) {
    return res.status(500).send('❌ Server error: ' + err.message);
  }
});


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
      memo
    });

    await serial.save();
    res.json({ success: true, serial: key });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/serials
router.get('/serials', async (req, res) => {
  try {
    const serials = await Serial.find().sort({ createdAt: -1 }); // 최신순 정렬
    res.json(serials);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
