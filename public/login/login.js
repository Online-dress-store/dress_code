// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  // Check for error message in URL
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  
  if (message) {
    showMessage(message, 'error');
  }
  
  // Handle form submission
  loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';
    
    try {
      // Show loading state
      const submitBtn = loginForm.querySelector('.login-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Signing In...';
      submitBtn.disabled = true;
      
      // Send login request
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          rememberMe
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          // Check for returnTo parameter
          const urlParams = new URLSearchParams(window.location.search);
          const returnTo = urlParams.get('returnTo');
          
          if (returnTo) {
            window.location.href = decodeURIComponent(returnTo);
          } else {
            window.location.href = '/';
          }
        }, 1000);
      } else {
        showMessage(data.error || 'Login failed', 'error');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      // Reset button state
      const submitBtn = loginForm.querySelector('.login-btn');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});

// Show message function
function showMessage(message, type = 'info') {
  // Remove existing messages
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  
  // Insert before the form
  const form = document.getElementById('loginForm');
  form.parentNode.insertBefore(messageDiv, form);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}
