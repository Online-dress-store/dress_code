document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Login attempt:', {
      username: username,
      password: password
    });
    
    // Here you would typically send the data to your server
    // For now, just log the form data
    alert('Login functionality will be implemented here');
  });
});
