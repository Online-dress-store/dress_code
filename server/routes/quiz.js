const router = require('express').Router();
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { createRateLimit } = require('../middleware/rateLimit');
const persist = require('../modules/persist_module');

const WHITELISTS = {
  occasion: ['Wedding guest','Prom','Evening','Casual','Work','Holiday','Summer'],
  // length is sparsely defined in catalog → treat as optional; we will not expose it client-side
  color: ['White','Black','Blue','Red','Pink','Green','Beige','Pastel','Jewel','Neutral','Flower','Any'],
  budget: ['<150','150–300','300+'],
  size: ['XS','S','M','L','XL']
};

// normalization helpers
const COLOR_SYNONYMS = {
  white:['white','ivory','cream'],
  black:['black'],
  blue:['blue','navy','teal','turquoise','aqua','sky'],
  red:['red','burgundy','maroon','wine'],
  pink:['pink','blush','rose','magenta'],
  green:['green','emerald','olive','sage'],
  beige:['beige','tan','camel','sand'],
  pastel:['pastel','light','baby'],
  jewel:['jewel','emerald','sapphire','ruby'],
  neutral:['neutral','black','white','beige','grey','gray'],
  flower:['floral','flower']
};

function normalizeArray(arr) { return Array.isArray(arr) ? arr.map(v => String(v||'').trim()) : []; }
function toLower(arr) { return arr.map(v => v.toLowerCase()); }
function normSizes(arr) { return normalizeArray(arr).map(s => String(s).toUpperCase()); }

function isSubset(arr, allowed) {
  // allow whitelisted values OR simple custom color words (letters only, up to 20)
  return Array.isArray(arr) && arr.every(v => allowed.includes(v) || /^[a-zA-Z]{1,20}$/.test(String(v||'')));
}

router.post('/', createRateLimit(15 * 60 * 1000, 100), requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const answers = {
      occasion: normalizeArray(Array.isArray(body.occasion) ? body.occasion : (body.occasion ? [body.occasion] : []) ),
      // length omitted intentionally
      color: normalizeArray(Array.isArray(body.color) ? body.color : (body.color ? [body.color] : []) ),
      budget: normalizeArray(Array.isArray(body.budget) ? body.budget : (body.budget ? [body.budget] : []) ),
      size: normSizes(Array.isArray(body.size) ? body.size : (body.size ? [body.size] : []) )
    };
    if (!isSubset(answers.occasion, WHITELISTS.occasion)) return res.status(400).json({ error: 'Invalid occasion' });
    if (!isSubset(answers.color, WHITELISTS.color)) return res.status(400).json({ error: 'Invalid color' });
    if (!isSubset(answers.budget, WHITELISTS.budget)) return res.status(400).json({ error: 'Invalid budget' });
    if (!isSubset(answers.size, WHITELISTS.size)) return res.status(400).json({ error: 'Invalid size' });
    const token = crypto.randomBytes(12).toString('hex');
    const rows = await persist.readQuizSubmissions();
    rows.push({ userId: req.user.userId, answers, token, ts: Date.now() });
    await persist.writeQuizSubmissions(rows);
    res.json({ token });
  } catch (e) {
    console.error('quiz POST error', e);
    res.status(500).json({ error: 'Failed to save quiz' });
  }
});

function inRanges(price, ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) return true;
  return ranges.some(r => {
    if (r === '<150') return price < 150;
    if (r === '150–300') return price >= 150 && price <= 300;
    if (r === '300+') return price > 300;
    return false;
  });
}

function intersects(a, b) { if (!Array.isArray(a) || !Array.isArray(b)) return false; return a.some(x => b.includes(x)); }

function expandColorQuery(colors) {
  const out = new Set();
  toLower(colors).forEach(c => {
    if (COLOR_SYNONYMS[c]) COLOR_SYNONYMS[c].forEach(x => out.add(x));
    else out.add(c);
  });
  return Array.from(out);
}

function scoreProduct(p, a) {
  let score = 0; let dims = 0;
  // Normalize product facets
  const title = String(p.title||'');
  const desc = String(p.description||'');
  const tags = (p.tags||[]).map(x=>String(x));
  const occs = [p.category, ...(p.occasion||[]), ...tags].filter(Boolean).map(x=>String(x).toLowerCase());
  const productSizes = Array.from(new Set([...(p.sizes||[]), ...((p.variants||[]).map(v=>v.size)).filter(Boolean)])).map(s=>String(s).toUpperCase());
  // Heuristic length from title/tags/description
  const blob = (title + ' ' + tags.join(' ') + ' ' + desc).toLowerCase();
  const plength = blob.includes('maxi') ? 'Maxi' : blob.includes('midi') ? 'Midi' : blob.includes('mini') ? 'Mini' : undefined;

  // Occasion (case-insensitive)
  if (a.occasion.length > 0) { dims++; const ok = a.occasion.some(o => occs.includes(String(o).toLowerCase())); if (ok) score++; else return -1; }
  // Color (skip if 'Any' selected)
  if (a.color.length > 0 && !a.color.includes('Any')) {
    dims++;
    const colors = [p.color, p.dominantColor, ...(p.colors||[]), ...(p.tags||[]), ...((p.variants||[]).map(v=>v.color))].filter(Boolean).map(x=>String(x).toLowerCase());
    const lc = colors.map(x => x.toLowerCase());
    const wanted = expandColorQuery(a.color);
    const ok = wanted.some(q => lc.some(x => x.includes(q)));
    if (ok) score++; else return -1;
  }
  // Budget
  if (a.budget.length > 0) { dims++; if (inRanges(Number(p.price||0), a.budget)) score++; else return -1; }
  // Size
  if (a.size.length > 0) { dims++; if (intersects(productSizes, a.size)) score++; else return -1; }
  return score + dims * 0.001; // tiny weight to prefer matching more dimensions equally
}

router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const token = (req.query.token || '').toString();
    if (!token) return res.status(400).json({ error: 'token required' });
    const rows = await persist.readQuizSubmissions();
    const row = rows.find(r => r.userId === req.user.userId && r.token === token);
    if (!row) return res.status(404).json({ error: 'Invalid token' });
    const products = await persist.listProducts();
    function runFilter(a){
      const scored = products.map(p => ({ p, s: scoreProduct(p, a) }))
        .filter(x => x.s >= 0)
        .sort((a,b) => b.s - a.s || (Number(a.p.price||0) - Number(b.p.price||0)));
      return scored;
    }
    let answers = row.answers;
    let scored = runFilter(answers);
    let relaxed = false;
    if (scored.length === 0) { // progressively relax
      // drop size
      answers = Object.assign({}, row.answers, { size: [] });
      scored = runFilter(answers); relaxed = relaxed || scored.length>0;
    }
    if (scored.length === 0) {
      // drop color
      answers = Object.assign({}, row.answers, { color: [] });
      scored = runFilter(answers); relaxed = relaxed || scored.length>0;
    }
    if (scored.length === 0) {
      // drop occasion
      answers = Object.assign({}, row.answers, { occasion: [] });
      scored = runFilter(answers); relaxed = relaxed || scored.length>0;
    }
    const top = scored.slice(0, 20).map(x => ({
      id: x.p.id,
      title: x.p.title,
      price: x.p.price,
      category: x.p.category,
      image: x.p.images && (x.p.images.main || x.p.images[0] || x.p.image) || null,
      sizes: x.p.sizes || []
    }));
    res.json({ results: top, relaxed });
  } catch (e) {
    console.error('quiz GET error', e);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

module.exports = router;


