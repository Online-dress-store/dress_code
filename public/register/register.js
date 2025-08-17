document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    // Basic validation
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        alert(data.error || 'Registration failed.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  });
});
