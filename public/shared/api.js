// API helpers
export async function fetchProducts() {
  const res = await fetch('/data/products.json');
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function saveOrder(orderData) {
  const res = await fetch('/api/auth/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ orderData })
  });
  if (!res.ok) throw new Error('Failed to save order');
  return res.json();
}

export async function fetchOrders() {
  const res = await fetch('/api/auth/orders', {
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}
