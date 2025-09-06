// Auth helpers
export async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (_) { return null; }
}

export async function requireLogin(returnTo = location.pathname + location.search) {
  const user = await getCurrentUser();
  if (!user) {
    location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    return null;
  }
  return user;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    location.href = '/';
  } catch (_) {}
}

// Export auth state for use in other modules
export let isAuthenticated = false;
export let currentUser = null;

// Update auth state
export function updateAuthState(authenticated, user = null) {
  isAuthenticated = authenticated;
  currentUser = user;
}

// Check authentication status
export async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      isAuthenticated = true;
    } else if (response.status === 401) {
      // User is not logged in (this is expected)
      currentUser = null;
      isAuthenticated = false;
    } else {
      // Other error
      console.error('Auth check error:', response.status, response.statusText);
      currentUser = null;
      isAuthenticated = false;
    }
  } catch (error) {
    console.error('Auth check error:', error);
    currentUser = null;
    isAuthenticated = false;
  }
}
