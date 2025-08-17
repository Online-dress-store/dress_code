document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        alert(data.error || 'Login failed.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  });
});
