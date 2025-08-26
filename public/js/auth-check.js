// Shared authentication check module
class AuthCheck {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Check authentication status
  async checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (response.ok) {
        this.currentUser = data.user;
        this.isAuthenticated = true;
        return true;
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.currentUser = null;
      this.isAuthenticated = false;
      return false;
    }
  }

  // Show unauthorized screen
  showUnauthorizedScreen() {
    const currentPath = window.location.pathname + window.location.search;
    const returnTo = encodeURIComponent(currentPath);
    
    const unauthorizedHTML = `
      <div class="unauthorized-screen">
        <div class="unauthorized-content">
          <div class="unauthorized-icon">
            <i class="ri-lock-line"></i>
          </div>
          <h1>Not Logged In</h1>
          <p>You need to be logged in to access this page.</p>
          <div class="unauthorized-actions">
            <a href="/login?returnTo=${returnTo}" class="login-btn-primary">
              <i class="ri-login-box-line"></i>
              Log In
            </a>
            <a href="/register?returnTo=${returnTo}" class="register-btn-secondary">
              <i class="ri-user-add-line"></i>
              Create Account
            </a>
          </div>
          <div class="unauthorized-footer">
            <a href="/" class="back-home-link">
              <i class="ri-arrow-left-line"></i>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    `;
    
    // Replace the entire page content
    document.body.innerHTML = unauthorizedHTML;
    
    // Add the CSS for the unauthorized screen
    this.addUnauthorizedStyles();
  }

  // Add CSS styles for unauthorized screen
  addUnauthorizedStyles() {
    if (document.getElementById('unauthorized-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'unauthorized-styles';
    style.textContent = `
      .unauthorized-screen {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f5f2eb 0%, #e8e4dd 50%, #f5f2eb 100%);
        font-family: 'Inter', sans-serif;
        padding: 20px;
      }

      .unauthorized-content {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24px;
        padding: 48px 40px;
        text-align: center;
        max-width: 400px;
        width: 100%;
        box-shadow: 
          0 20px 40px rgba(139, 125, 107, 0.1),
          0 8px 16px rgba(139, 125, 107, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .unauthorized-icon {
        font-size: 64px;
        color: #d4a574;
        margin-bottom: 24px;
      }

      .unauthorized-content h1 {
        font-family: 'Playfair Display', serif;
        font-size: 28px;
        font-weight: 600;
        color: #2c2c2c;
        margin-bottom: 12px;
        letter-spacing: -0.5px;
      }

      .unauthorized-content p {
        font-size: 16px;
        color: #8b7d6b;
        margin-bottom: 32px;
        line-height: 1.5;
      }

      .unauthorized-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 32px;
      }

      .login-btn-primary {
        background: linear-gradient(135deg, #d4a574 0%, #c19a6b 100%);
        color: white;
        text-decoration: none;
        padding: 16px 24px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        font-family: 'Inter', sans-serif;
        letter-spacing: 0.3px;
      }

      .login-btn-primary:hover {
        background: linear-gradient(135deg, #c19a6b 0%, #b08a5a 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(212, 165, 116, 0.3);
      }

      .register-btn-secondary {
        background: transparent;
        color: #8b7d6b;
        text-decoration: none;
        padding: 16px 24px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        font-family: 'Inter', sans-serif;
        border: 2px solid #e8e4dd;
      }

      .register-btn-secondary:hover {
        background: rgba(139, 125, 107, 0.05);
        border-color: #d4a574;
        color: #6b5b47;
      }

      .unauthorized-footer {
        border-top: 1px solid rgba(139, 125, 107, 0.2);
        padding-top: 24px;
      }

      .back-home-link {
        color: #8b7d6b;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        padding: 8px 16px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(139, 125, 107, 0.2);
      }

      .back-home-link:hover {
        color: #6b5b47;
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(139, 125, 107, 0.15);
      }

      @media (max-width: 480px) {
        .unauthorized-content {
          padding: 32px 24px;
        }
        
        .unauthorized-content h1 {
          font-size: 24px;
        }
        
        .unauthorized-icon {
          font-size: 48px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Initialize authentication check for protected pages
  async init() {
    const isAuthenticated = await this.checkAuth();
    
    if (!isAuthenticated) {
      this.showUnauthorizedScreen();
      return false;
    }
    
    return true;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  getIsAuthenticated() {
    return this.isAuthenticated;
  }
}

// Export for use in other files
window.AuthCheck = AuthCheck;
