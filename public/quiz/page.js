document.addEventListener('DOMContentLoaded', () => {
  // Lazy-load Quick View modal
  let quickView = null;
  async function ensureQuickView(){
    if (!quickView) {
      const mod = await import('../shared/quickview.js');
      quickView = mod.quickViewModal;
    }
  }
  const form = document.getElementById('quizForm');
  const results = document.getElementById('results');
  const statusEl = document.getElementById('status');
  const relaxedNote = document.getElementById('relaxedNote');
  const clearBtn = document.getElementById('clearBtn');
  function showToast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    results.prepend(t);
    setTimeout(()=>{ t.remove(); }, 2000);
  }
  // Improve status messaging
  function setStatus(msg){
    if (msg && typeof msg === 'object') statusEl.textContent = msg.message || msg.error || JSON.stringify(msg);
    else statusEl.textContent = msg || '';
  }

  function getSelections(name) {
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
  }

  // Custom color token support
  const colorInput = document.getElementById('colorCustom');
  const addColorBtn = document.getElementById('addColor');
  const colorTokens = document.getElementById('colorTokens');
  function addColorToken(v){
    const val = String(v||'').trim(); if (!val) return;
    const token = document.createElement('span'); token.className='chip'; token.textContent=val;
    const hidden = document.createElement('input'); hidden.type='checkbox'; hidden.name='color'; hidden.value=val; hidden.checked=true; hidden.style.display='none';
    token.appendChild(hidden); const x = document.createElement('button'); x.type='button'; x.textContent='×'; x.className='chip-close'; x.onclick=()=>{ hidden.remove(); token.remove(); }; token.appendChild(x);
    colorTokens.appendChild(token);
  }
  addColorBtn.addEventListener('click', () => { addColorToken(colorInput.value); colorInput.value=''; colorInput.focus(); });

  // If "Any" color is checked, uncheck others on click
  const anyColor = document.querySelector('input[name="color"][value="Any"]');
  if (anyColor) {
    anyColor.addEventListener('change', () => {
      if (anyColor.checked) {
        form.querySelectorAll('input[name="color"]').forEach(i => { if (i !== anyColor) i.checked = false; });
      }
    });
    form.querySelectorAll('input[name="color"]:not([value="Any"])').forEach(i => {
      i.addEventListener('change', () => { if (i.checked) anyColor.checked = false; });
    });
  }

  // Make chips fully clickable + keyboard accessible
  function syncChipAria() {
    form.querySelectorAll('label.chip').forEach(lbl => {
      const inp = lbl.querySelector('input');
      if (!inp) return;
      lbl.setAttribute('role', 'button');
      lbl.setAttribute('tabindex', '0');
      lbl.setAttribute('aria-pressed', inp.checked ? 'true' : 'false');
    });
  }
  function toggleChip(lbl) {
    const inp = lbl.querySelector('input');
    if (!inp) return;
    inp.checked = !inp.checked;
    lbl.setAttribute('aria-pressed', inp.checked ? 'true' : 'false');
    // color Any exclusivity
    if (inp.name === 'color' && inp.value === 'Any' && inp.checked) {
      form.querySelectorAll('input[name="color"]').forEach(i => { if (i !== inp) { i.checked = false; i.closest('label')?.setAttribute('aria-pressed','false'); } });
    }
    if (inp.name === 'color' && inp.value !== 'Any' && inp.checked) {
      const ac = form.querySelector('input[name="color"][value="Any"]');
      if (ac) { ac.checked = false; ac.closest('label')?.setAttribute('aria-pressed','false'); }
    }
  }
  form.addEventListener('click', (e) => {
    const lbl = e.target.closest('label.chip');
    if (!lbl) return;
    e.preventDefault();
    toggleChip(lbl);
  });
  form.addEventListener('keydown', (e) => {
    const lbl = e.target.closest('label.chip');
    if (!lbl) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleChip(lbl); }
  });
  syncChipAria();

  // Clear button resets selections and UI
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      form.querySelectorAll('input[type="checkbox"]').forEach(i => { i.checked = false; });
      document.getElementById('colorTokens')?.replaceChildren();
      syncChipAria();
      setStatus(''); relaxedNote.textContent=''; results.innerHTML='';
    });
  }

  function render(items, relaxed=false) {
    results.innerHTML = '';
    if (!items || items.length === 0) { results.innerHTML = '<div class="empty"><p>No matches found.</p><button class="btn secondary" id="adjustBtn">Adjust filters</button></div>'; document.getElementById('adjustBtn').onclick=()=>{ form.style.display='block'; form.scrollIntoView({behavior:"smooth"}); }; return; }
    const grid = document.createElement('div'); grid.className = 'results-grid';
    items.forEach(p => {
      const card = document.createElement('div'); card.className = 'product-card';
      card.innerHTML = `
        <div class="image-wrap"><img src="${(p.image||'').replace(/^\//,'/')}" alt="${p.title||''}"></div>
        <div class="content">
          <h3>${p.title||''}</h3>
          <div class="price">$${p.price||'-'}</div>
          <div class="actions">
            <button type="button" class="btn secondary add-to-cart" data-id="${p.id}" data-price="${p.price}"><i class="ri-shopping-bag-2-line"></i> Add to Cart</button>
            <button type="button" class="btn secondary quick-view" data-id="${p.id}"><i class="ri-eye-line"></i> Quick View</button>
            <button type="button" class="btn secondary add-to-wishlist" data-id="${p.id}" data-title="${(p.title||'').replace(/"/g,'&quot;')}"><i class="ri-heart-line"></i> Add to Wishlist</button>
          </div>
        </div>`;
      grid.appendChild(card);
    });
    results.appendChild(grid);
    const controls = document.createElement('div'); controls.style.marginTop = '12px';
    controls.innerHTML = `<button id="refineBtn" class="btn secondary">Refine</button> <a class="btn secondary" href="/categories">View All</a>`;
    results.appendChild(controls);
    document.getElementById('refineBtn').addEventListener('click', () => { form.style.display='block'; results.scrollIntoView({ behavior:'smooth' }); });
    if (relaxed) relaxedNote.textContent = 'We relaxed your filters to find more options.'; else relaxedNote.textContent='';

    // Wire Add to Cart buttons
    results.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const id = btn.getAttribute('data-id');
          const price = Number(btn.getAttribute('data-price')||0);
          const card = btn.closest('.product-card');
          const titleEl = card ? card.querySelector('h3') : null;
          const imgEl = card ? card.querySelector('img') : null;
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.status === 401) { window.location.href = '/login?returnTo=' + encodeURIComponent('/quiz'); return; }
          const mod = await import('../shared/cart.js');
          mod.addToCart({ id, size: null, price, title: titleEl ? titleEl.textContent : '', image: imgEl ? imgEl.src : '' }, 99);
          showToast('Added to cart');
        } catch (_) { setStatus('Could not add to cart'); }
      });
    });

    // Wire Quick View
    results.querySelectorAll('.quick-view').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await ensureQuickView();
          // Fetch product details from catalog
          const id = btn.getAttribute('data-id');
          const res = await fetch('/products');
          const products = await res.json();
          const product = products.find(p => String(p.id) === String(id));
          if (!product) { setStatus('Product not found'); return; }
          quickView.open(product);
        } catch (e) { setStatus('Failed to open Quick View'); }
      });
    });

    // Wire Add to Wishlist
    results.querySelectorAll('.add-to-wishlist').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const id = btn.getAttribute('data-id');
          const title = btn.getAttribute('data-title') || '';
          const card = btn.closest('.product-card');
          const imgEl = card ? card.querySelector('img') : null;
          const priceEl = card ? card.querySelector('.price') : null;
          const price = priceEl ? Number(priceEl.textContent.replace(/[^0-9.]/g,'')) : 0;
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.status === 401) { window.location.href = '/login?returnTo=' + encodeURIComponent('/quiz'); return; }
          const mod = await import('../shared/wishlist.js');
          mod.addToWishlist({ id, title, price, image: imgEl ? imgEl.src : '' });
          showToast('Added to wishlist');
        } catch (_) { setStatus('Could not add to wishlist'); }
      });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Submitting…');
    try {
      const body = {
        occasion: getSelections('occasion'),
        // length removed; derived on server
        color: getSelections('color'),
        budget: getSelections('budget'),
        size: getSelections('size')
      };
      const res = await fetch('/api/quiz', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(body) });
      const json = await res.json().catch(()=>({}));
      if (!res.ok || !json.token) { setStatus((json && (json.error||json.message)) || `HTTP ${res.status}`); return; }
      setStatus('Loading…');
      const r2 = await fetch(`/api/quiz/recommendations?token=${encodeURIComponent(json.token)}`, { credentials: 'include' });
      const j2 = await r2.json().catch(()=>({}));
      if (!r2.ok || !j2.results) { setStatus((j2 && (j2.error||j2.message)) || `HTTP ${r2.status}`); return; }
      setStatus('');
      form.style.display = 'none';
      render(j2.results, !!j2.relaxed);
    } catch (e) {
      setStatus('Network error');
    }
  });
});


