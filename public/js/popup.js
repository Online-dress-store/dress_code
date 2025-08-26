// Reusable popup component
class Popup {
  constructor() {
    this.popup = null;
    this.overlay = null;
  }

  // Show popup with custom content
  show(content, options = {}) {
    // Remove existing popup if any
    this.hide();

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'popup-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'popup';
    this.popup.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.3s ease;
      font-family: 'Inter', sans-serif;
    `;

    // Add content
    this.popup.innerHTML = content;

    // Add close button if specified
    if (options.showClose !== false) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'popup-close';
      closeBtn.innerHTML = '<i class="ri-close-line"></i>';
      closeBtn.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 20px;
        color: #8b7d6b;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      `;

      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = '#f5f5f5';
        closeBtn.style.color = '#2c2c2c';
      });

      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
        closeBtn.style.color = '#8b7d6b';
      });

      closeBtn.addEventListener('click', () => {
        this.hide();
      });

      this.popup.appendChild(closeBtn);
    }

    // Add to DOM
    this.overlay.appendChild(this.popup);
    document.body.appendChild(this.overlay);

    // Animate in
    setTimeout(() => {
      this.popup.style.transform = 'scale(1)';
      this.popup.style.opacity = '1';
    }, 10);

    // Add click outside to close (optional)
    if (options.clickOutsideToClose !== false) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.hide();
        }
      });
    }
  }

  // Hide popup
  hide() {
    if (this.popup) {
      this.popup.style.transform = 'scale(0.9)';
      this.popup.style.opacity = '0';
      
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.popup = null;
        this.overlay = null;
      }, 300);
    }
  }

  // Show authentication required popup
  showAuthRequired(message, returnTo = null) {
    const currentPath = returnTo || window.location.pathname + window.location.search;
    const encodedReturnTo = encodeURIComponent(currentPath);
    
    const content = `
      <div class="auth-popup-content">
        <div class="auth-icon">
          <i class="ri-lock-line"></i>
        </div>
        <h3>Authentication Required</h3>
        <p>${message}</p>
        <div class="auth-actions">
          <a href="/login?returnTo=${encodedReturnTo}" class="auth-btn auth-btn-primary">
            <i class="ri-login-box-line"></i>
            Log In
          </a>
          <a href="/register?returnTo=${encodedReturnTo}" class="auth-btn auth-btn-secondary">
            <i class="ri-user-add-line"></i>
            Create Account
          </a>
        </div>
      </div>
    `;

    // Add styles for auth popup
    this.addAuthPopupStyles();

    this.show(content, { 
      showClose: true, 
      clickOutsideToClose: false 
    });
  }

  // Add styles for auth popup
  addAuthPopupStyles() {
    if (document.getElementById('auth-popup-styles')) return;

    const style = document.createElement('style');
    style.id = 'auth-popup-styles';
    style.textContent = `
      .auth-popup-content {
        text-align: center;
      }

      .auth-icon {
        font-size: 48px;
        color: #d4a574;
        margin-bottom: 16px;
      }

      .auth-popup-content h3 {
        font-family: 'Playfair Display', serif;
        font-size: 24px;
        font-weight: 600;
        color: #2c2c2c;
        margin-bottom: 12px;
        letter-spacing: -0.3px;
      }

      .auth-popup-content p {
        font-size: 16px;
        color: #8b7d6b;
        margin-bottom: 24px;
        line-height: 1.5;
      }

      .auth-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .auth-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 20px;
        border-radius: 12px;
        text-decoration: none;
        font-size: 16px;
        font-weight: 500;
        transition: all 0.3s ease;
        font-family: 'Inter', sans-serif;
      }

      .auth-btn-primary {
        background: linear-gradient(135deg, #d4a574 0%, #c19a6b 100%);
        color: white;
      }

      .auth-btn-primary:hover {
        background: linear-gradient(135deg, #c19a6b 0%, #b08a5a 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(212, 165, 116, 0.3);
      }

      .auth-btn-secondary {
        background: transparent;
        color: #8b7d6b;
        border: 2px solid #e8e4dd;
      }

      .auth-btn-secondary:hover {
        background: rgba(139, 125, 107, 0.05);
        border-color: #d4a574;
        color: #6b5b47;
        transform: translateY(-1px);
      }

      @media (max-width: 480px) {
        .auth-popup-content h3 {
          font-size: 20px;
        }
        
        .auth-icon {
          font-size: 40px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Export for use in other files
window.Popup = Popup;
