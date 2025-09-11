const router = require('express').Router();
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const sharp = require('sharp');
const fetch = require('node-fetch');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { createRateLimit } = require('../middleware/rateLimit');

const MAX_MB = Number(process.env.TRYON_MAX_FILE_MB || 10);
const MAX_BYTES = MAX_MB * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES } });

const TMP_DIR = path.join(os.tmpdir(), 'tryon');
const MAX_DIM = 1600;

async function ensureTmp() { try { await fs.mkdir(TMP_DIR, { recursive: true }); } catch (_) {} }

async function loadImageFromUrl(url) {
  if (!/^https?:\/\//i.test(url || '')) throw new Error('URL not allowed');
  const r = await fetch(url, { timeout: 12000 });
  if (!r.ok) throw new Error('Failed to fetch image');
  return await r.buffer();
}

// Minimal single-endpoint generation: accept person_image + dress_url|dress_image; output URLs
router.post('/generate', createRateLimit(15 * 60 * 1000, 40), requireAuth, upload.fields([
  { name: 'person_image', maxCount: 1 },
  { name: 'dress_image', maxCount: 1 }
]), async (req, res) => {
  try {
    await ensureTmp();
    const person = req.files && req.files['person_image'] && req.files['person_image'][0];
    const dressFile = req.files && req.files['dress_image'] && req.files['dress_image'][0];
    const dressUrl = req.body && req.body.dress_url;
    if (!person) return res.status(400).json({ code: 'BAD_INPUT', message: 'person_image required' });

    // Save person (rotate, downscale)
    const personName = `tryon_${Date.now()}_${Math.random().toString(36).slice(2)}-person.jpg`;
    const personPath = path.join(TMP_DIR, personName);
    await sharp(person.buffer).rotate().resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toFile(personPath);

    // Obtain dress buffer
    let dressBuf;
    if (dressFile) dressBuf = dressFile.buffer; else if (dressUrl) dressBuf = await loadImageFromUrl(dressUrl); else return res.status(400).json({ code: 'BAD_INPUT', message: 'dress_url or dress_image required' });

    // Remove near-white background (simple RGB threshold)
    let img = sharp(dressBuf).rotate().resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });
    const raw = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const p = raw.data; const tol = Math.round(255 * 0.15); // ~85% white
    for (let i = 0; i < p.length; i += 4) { const r = p[i], g = p[i+1], b = p[i+2]; if (r > 255 - tol && g > 255 - tol && b > 255 - tol) p[i+3] = 0; }
    const dressName = `tryon_${Date.now()}_${Math.random().toString(36).slice(2)}-dress.png`;
    const dressPath = path.join(TMP_DIR, dressName);
    await sharp(p, { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } }).png({ quality: 85 }).toFile(dressPath);

    return res.json({ dressUrl: `/tmp/${dressName}`, personUrl: `/tmp/${personName}` });
  } catch (e) {
    const msg = (e && e.message) || 'Failed to process';
    const status = msg.includes('File too large') ? 413 : 500;
    return res.status(status).json({ code: 'PROCESS_ERROR', message: msg, hint: 'Use JPEG/PNG/WebP up to ~10MB' });
  }
});

module.exports = router;


