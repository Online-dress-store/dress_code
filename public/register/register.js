// Import navigation
import { createNavigation, initNavigation, updateAuthStatus } from "../shared/navigation.js";

// Register page functionality
document.addEventListener('DOMContentLoaded', async function() {
  // Load navigation
  const navigationElement = document.getElementById('navigation');
  if (navigationElement) {
    navigationElement.innerHTML = createNavigation();
    initNavigation();
    await updateAuthStatus();
  }
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
    
    // Show loading state
    const submitBtn = registerForm.querySelector('.signup-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
      // Clear any existing invalid tokens by logging out first
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        // Ignore logout errors
      }
      
      // Send registration request
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          confirmPassword
        })
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from register:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          body: text
        });
        showMessage('Server error. Please try again.', 'error');
        return;
      }
      
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
