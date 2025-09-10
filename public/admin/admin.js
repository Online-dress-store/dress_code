import { createNavigation, initNavigation, updateAuthStatus } from "../shared/navigation.js";

document.addEventListener('DOMContentLoaded', async () => {
  const nav = document.getElementById('navigation');
  if (nav) { nav.innerHTML = createNavigation(); initNavigation(); await updateAuthStatus(); }

  // Verify admin role
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) { window.location.href = '/login?returnTo=' + encodeURIComponent(location.pathname); return; }
  const data = await res.json();
  const isAdmin = data.user && data.user.role === 'admin';
  if (!isAdmin) {
    document.getElementById('notAdmin').style.display = 'block';
    return;
  }
  document.getElementById('adminContent').style.display = 'block';

  // Load initial data
  await loadProducts();
  await loadActivityLog();

  // Handle activity log refresh
  document.getElementById('refreshActivity').addEventListener('click', loadActivityLog);
  
  // Handle username filter
  document.getElementById('usernameFilter').addEventListener('input', async (e) => {
    const prefix = e.target.value.trim();
    await loadActivityLog(prefix);
  });

  // No creation in edit-only mode
});

async function loadProducts() {
  try {
    const resp = await fetch('/api/admin/products', { credentials: 'include' });
    if (!resp.ok) {
      const error = await resp.json();
      alert('Failed to load products: ' + (error.message || 'Unknown error'));
      return;
    }
    
    const data = await resp.json();
    const list = data.data || [];
    const root = document.getElementById('products');
    root.innerHTML = '';
    
    list.forEach(p => {
      const el = document.createElement('div');
      el.className = 'product';
      const imgSrc = (p.picture || p.image || (p.images && p.images.main) || '').toString();
      const sizes = Array.isArray(p.sizes) && p.sizes.length
        ? p.sizes
        : Array.isArray(p.variants) ? p.variants.map(v => v.size) : [];
      const sizesText = (sizes || []).join(', ');
      el.innerHTML = `
        <img src="${imgSrc}" alt="${p.title}"> 
        <div class="title" data-field="title">${p.title}</div> 
        <div class="price" data-field="price">${Number(p.price).toFixed(2)}</div>
        <div class="sizes" data-field="sizes">${sizesText}</div>
        <button class="edit" data-id="${p.id}">Edit</button>
        <button class="delete" data-id="${p.id}">Delete</button>
      `;
      
      el.querySelector('.delete').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        const resp = await fetch('/api/admin/products/' + encodeURIComponent(p.id), { 
          method: 'DELETE', 
          credentials: 'include' 
        });
        
        if (!resp.ok) { 
          const error = await resp.json();
          alert('Failed to delete: ' + (error.message || 'Unknown error')); 
          return; 
        }
        
        await loadProducts();
      });
      
      const editBtn = el.querySelector('.edit');
      editBtn.addEventListener('click', async () => {
        const isEditing = editBtn.dataset.editing === 'true';
        const titleEl = el.querySelector('[data-field="title"]');
        const priceEl = el.querySelector('[data-field="price"]');
        const sizesEl = el.querySelector('[data-field="sizes"]');

        if (!isEditing) {
          // Enter edit mode
          editBtn.dataset.editing = 'true';
          editBtn.textContent = 'Save';
          titleEl.contentEditable = 'true';
          priceEl.contentEditable = 'true';
          sizesEl.contentEditable = 'true';
          titleEl.focus();
          return;
        }

        // Save changes
        const newTitle = titleEl.textContent.trim();
        const newPrice = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
        const sizesArr = sizesEl.textContent.split(',').map(s => s.trim()).filter(Boolean);
        if (!newTitle || isNaN(newPrice)) { alert('Invalid title or price'); return; }

        const resp = await fetch('/api/admin/products/' + encodeURIComponent(p.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ title: newTitle, price: newPrice, sizes: sizesArr })
        });
        
        if (!resp.ok) {
          let msg = 'Unknown error';
          try { const err = await resp.json(); msg = err.message || JSON.stringify(err); } catch(_) {}
          alert('Failed to save: ' + msg);
          return;
        }
        editBtn.dataset.editing = 'false';
        editBtn.textContent = 'Edit';
        titleEl.contentEditable = 'false';
        priceEl.contentEditable = 'false';
        sizesEl.contentEditable = 'false';
        await loadProducts();
      });
      
      root.appendChild(el);
    });
  } catch (error) {
    console.error('Error loading products:', error);
    alert('Failed to load products');
  }
}

async function loadActivityLog(usernamePrefix = '') {
  try {
    const url = usernamePrefix 
      ? `/api/admin/activity?username=${encodeURIComponent(usernamePrefix)}`
      : '/api/admin/activity';
      
    const resp = await fetch(url, { credentials: 'include' });
    if (!resp.ok) {
      const error = await resp.json();
      alert('Failed to load activity log: ' + (error.message || 'Unknown error'));
      return;
    }
    
    const data = await resp.json();
    const activities = data.data || [];
    const tbody = document.getElementById('activityTableBody');
    tbody.innerHTML = '';
    
    if (activities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">No activity logs found</td></tr>';
      return;
    }
    
    // Sort by datetime (newest first)
    activities.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    
    activities.forEach(activity => {
      const row = document.createElement('tr');
      const date = new Date(activity.datetime);
      const formattedDate = date.toLocaleString();
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${activity.username}</td>
        <td>${activity.activity}</td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading activity log:', error);
    alert('Failed to load activity log');
  }
}


