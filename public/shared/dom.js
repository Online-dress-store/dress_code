// DOM utilities (ES module)
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function on(event, selector, handler, scope = document) {
  scope.addEventListener(event, function(e) {
    const target = e.target.closest(selector);
    if (target && scope.contains(target)) {
      handler(e, target);
    }
  });
}

export function create(tag, className = '', attrs = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

export function setText(el, text) { el.textContent = text; }
export function setHTML(el, html) { el.innerHTML = html; }

// Message display utilities
export function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `product-message product-message-${type}`;
  messageDiv.textContent = message;
  
  // Add styles
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  // Set colors based on type
  if (type === 'success') {
    messageDiv.style.background = '#4CAF50';
    messageDiv.style.color = 'white';
  } else if (type === 'error') {
    messageDiv.style.background = '#f44336';
    messageDiv.style.color = 'white';
  } else if (type === 'info') {
    messageDiv.style.background = '#2196F3';
    messageDiv.style.color = 'white';
  }
  
  document.body.appendChild(messageDiv);
  
  // Animate in
  setTimeout(() => {
    messageDiv.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    messageDiv.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 300);
  }, 3001);
}

export function showNotLoggedInMessage(message) {
  // This will be handled by the popup utility
  if (window.popup) {
    window.popup.showAuthRequired(message);
  }
}
