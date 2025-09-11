#!/usr/bin/env node
/* eslint-disable */
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = process.env.BASE || 'http://localhost:3001';

function log(title) { console.log(`\n=== ${title} ===`); }
function pass(name) { console.log(`✅ PASS - ${name}`); }
function fail(name, err) { console.log(`❌ FAIL - ${name}:`, err && err.message ? err.message : err); }

async function run() {
  let cookies = '';
  let adminCookies = '';

  // helper to keep/set cookies
  async function f(path, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    if (opts.useAdmin) {
      if (adminCookies) headers.cookie = adminCookies;
    } else {
      if (cookies) headers.cookie = cookies;
    }
    const res = await fetch(BASE + path, Object.assign({}, opts, { headers }));
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      if (opts.useAdmin) adminCookies = setCookie; else cookies = setCookie;
    }
    return res;
  }

  log('Health');
  try {
    const res = await f('/health');
    const data = await res.json();
    if (data.status === 'ok') pass('GET /health'); else throw new Error('bad body');
  } catch (e) { fail('GET /health', e); }

  log('Products');
  try {
    const res = await f('/products');
    if (!res.ok) throw new Error('status ' + res.status);
    const arr = await res.json();
    if (Array.isArray(arr)) pass('GET /products returns array'); else throw new Error('not array');
  } catch (e) { fail('GET /products', e); }

  log('Auth guest guards');
  try {
    const res = await f('/api/auth/me');
    if (res.status === 401) pass('GET /api/auth/me as guest -> 401'); else throw new Error('expected 401');
  } catch (e) { fail('GET /api/auth/me guest', e); }

  log('Register and Login');
  const uname = 'user_' + Math.random().toString(36).slice(2,7);
  try {
    // register
    let res = await f('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: uname, password: 'secret12', confirmPassword: 'secret12' }) });
    if (!res.ok) throw new Error('register status ' + res.status);
    pass('POST /api/auth/register');

    // me
    res = await f('/api/auth/me');
    if (res.ok) pass('GET /api/auth/me after register'); else throw new Error('me not ok');

    // logout
    res = await f('/api/auth/logout', { method: 'POST' });
    if (res.ok) pass('POST /api/auth/logout'); else throw new Error('logout failed');

    // login with rememberMe false
    res = await f('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: uname, password: 'secret12', rememberMe: false }) });
    if (!res.ok) throw new Error('login status ' + res.status);
    pass('POST /api/auth/login');
  } catch (e) { fail('Auth flow', e); }

  log('Cart/Wishlist user data');
  try {
    let res = await f('/api/auth/cart');
    if (res.status === 200) pass('GET /api/auth/cart'); else throw new Error('status ' + res.status);
    res = await f('/api/auth/wishlist');
    if (res.status === 200) pass('GET /api/auth/wishlist'); else throw new Error('status ' + res.status);
  } catch (e) { fail('User data endpoints', e); }

  log('Admin');
  try {
    // login as admin
    let res = await f('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin', rememberMe: false }) , useAdmin: true});
    if (!res.ok) throw new Error('admin login status ' + res.status);

    // list admin products
    res = await f('/api/admin/products', { useAdmin: true });
    if (!res.ok) throw new Error('list products ' + res.status);
    const before = (await res.json()).data || [];

    // create product
    res = await f('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Test Product', picture: 'https://example.com/img.jpg', price: 10 }), useAdmin: true });
    if (res.status !== 201) throw new Error('create status ' + res.status);
    const created = (await res.json()).data;
    pass('POST /api/admin/products');

    // update product
    res = await f('/api/admin/products/' + created.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: 12, sizes: ['S','M'] }), useAdmin: true });
    if (!res.ok) throw new Error('update status ' + res.status);
    pass('PUT /api/admin/products/:id');

    // delete product
    res = await f('/api/admin/products/' + created.id, { method: 'DELETE', useAdmin: true });
    if (!res.ok) throw new Error('delete status ' + res.status);
    pass('DELETE /api/admin/products/:id');

    // activity log
    res = await f('/api/admin/activity?username=adm', { useAdmin: true });
    if (!res.ok) throw new Error('activity status ' + res.status);
    pass('GET /api/admin/activity?username=adm');
  } catch (e) { fail('Admin suite', e); }

  log('Public activity logging');
  try {
    const res = await f('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activity: 'add-to-cart' }) });
    if (!res.ok) throw new Error('status ' + res.status);
    pass('POST /api/activity add-to-cart');
  } catch (e) { fail('Public activity', e); }

  log('Accessories');
  try {
    // Test accessories endpoint with a valid product ID
    const res = await f('/api/accessories?productId=p_drs_001');
    if (!res.ok) throw new Error('accessories status ' + res.status);
    const body = await res.json();
    if (!body.success || !Array.isArray(body.recommendations)) throw new Error('invalid response format');
    if (body.recommendations.length !== 3) throw new Error('should return exactly 3 recommendations');
    pass('GET /api/accessories?productId=p_drs_001');
    
    // Test with missing productId
    const res2 = await f('/api/accessories');
    if (res2.status !== 400) throw new Error('should return 400 for missing productId');
    pass('GET /api/accessories (missing productId) -> 400');
    
    // Test with invalid productId
    const res3 = await f('/api/accessories?productId=invalid');
    if (res3.status !== 404) throw new Error('should return 404 for invalid productId');
    pass('GET /api/accessories?productId=invalid -> 404');
  } catch (e) { fail('Accessories suite', e); }

  log('Style Quiz');
  try {
    // Ensure logged in as a fresh user
    const uq = 'quiz_' + Math.random().toString(36).slice(2,7);
    let res = await f('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: uq, password: 'secret12', confirmPassword: 'secret12' }) });
    if (!res.ok) throw new Error('register status ' + res.status);
    // Post quiz answers
    const body = {
      occasion: ['Evening','Casual'],
      length: ['Midi'],
      color: ['Black','Red'],
      budget: ['150–300'],
      size: ['S','M']
    };
    res = await f('/api/quiz', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('quiz post ' + res.status);
    const q = await res.json();
    if (!q.token) throw new Error('no token');
    pass('POST /api/quiz -> token');

    // Get recommendations
    res = await f('/api/quiz/recommendations?token=' + encodeURIComponent(q.token));
    if (!res.ok) throw new Error('quiz get ' + res.status);
    const rec = await res.json();
    if (!rec.items || !Array.isArray(rec.items)) throw new Error('bad items');
    pass('GET /api/quiz/recommendations -> items');

    // Invalid token should 404
    res = await f('/api/quiz/recommendations?token=badtoken');
    if (res.status === 404) pass('GET /api/quiz/recommendations invalid -> 404'); else throw new Error('expected 404');
  } catch (e) { fail('Quiz suite', e); }

  console.log('\nAll tests completed.');
}

run();
