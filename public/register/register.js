// Register page functionality
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  
  // Handle form submission
  registerForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(registerForm);
    const username = formData.get('username');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Client-side validation
    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }
    
    try {
      // Show loading state
      const submitBtn = registerForm.querySelector('.signup-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating Account...';
      submitBtn.disabled = true;
      
      // Send registration request
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          confirmPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Account created successfully! Redirecting...', 'success');
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
        showMessage(data.error || 'Registration failed', 'error');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      // Reset button state
      const submitBtn = registerForm.querySelector('.signup-btn');
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
  const form = document.getElementById('registerForm');
  form.parentNode.insertBefore(messageDiv, form);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}
