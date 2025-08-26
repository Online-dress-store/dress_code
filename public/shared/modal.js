// Reusable modal component with accessibility features (ES Module)
export default class Modal {
  constructor() {
    this.modal = null;
    this.overlay = null;
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.previousActiveElement = null;
    this.onCloseCallback = null;
  }

  createModal(content, options = {}) {
    const {
      title = '',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      className = '',
      size = 'medium',
      onClose = null
    } = options;

    this.destroy();

    this.modal = document.createElement('div');
    this.modal.className = `modal ${className}`;
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    if (title) this.modal.setAttribute('aria-labelledby', 'modal-title');

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');

    const modalContent = document.createElement('div');
    modalContent.className = `modal-content modal-${size}`;

    if (title) {
      const titleElement = document.createElement('h2');
      titleElement.id = 'modal-title';
      titleElement.className = 'modal-title';
      titleElement.textContent = title;
      modalContent.appendChild(titleElement);
    }

    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.setAttribute('aria-label', 'Close modal');
    closeButton.innerHTML = '<i class="ri-close-line"></i>';
    closeButton.addEventListener('click', () => this.close());
    modalContent.appendChild(closeButton);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'modal-body';
    contentWrapper.innerHTML = content;
    modalContent.appendChild(contentWrapper);

    this.modal.appendChild(modalContent);
    this.overlay.appendChild(this.modal);

    document.body.appendChild(this.overlay);

    this.onCloseCallback = onClose;

    if (closeOnOverlayClick) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    if (closeOnEscape) {
      this._keydownHandler = this.handleKeydown.bind(this);
      document.addEventListener('keydown', this._keydownHandler);
    }

    this.setupFocusTrap();
    this.show();

    addModalStyles();

    return this.modal;
  }

  show() {
    this.previousActiveElement = document.activeElement;
    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
      this.modal.classList.add('visible');
    });
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }
  }

  close() {
    if (!this.overlay || !this.modal) return;
    this.overlay.classList.remove('visible');
    this.modal.classList.remove('visible');
    setTimeout(() => this.destroy(), 300);
    if (this.previousActiveElement) this.previousActiveElement.focus();
  }

  destroy() {
    if (this.onCloseCallback && typeof this.onCloseCallback === 'function') {
      try { this.onCloseCallback(); } catch (_) {}
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }
    this.modal = null;
    this.overlay = null;
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.previousActiveElement = null;
    this.onCloseCallback = null;
  }

  handleKeydown(event) {
    if (event.key === 'Escape') this.close();
    else if (event.key === 'Tab') this.handleTabKey(event);
  }

  handleTabKey(event) {
    if (this.focusableElements.length === 0) return;
    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement.focus();
      }
    }
  }

  setupFocusTrap() {
    if (!this.modal) return;
    this.focusableElements = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (this.focusableElements.length > 0) {
      this.firstFocusableElement = this.focusableElements[0];
      this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    }
  }

  updateContent(content) {
    if (!this.modal) return;
    const body = this.modal.querySelector('.modal-body');
    if (body) {
      body.innerHTML = content;
      this.setupFocusTrap();
    }
  }
}

function addModalStyles() {
  if (document.getElementById('modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'modal-styles';
  style.textContent = `
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; opacity: 0; transition: opacity .3s ease; padding: 20px; }
    .modal-overlay.visible { opacity: 1; }
    .modal { background: #fff; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,.15); position: relative; max-width: 90vw; max-height: 90vh; overflow: hidden; transform: scale(.9); transition: transform .3s ease; }
    .modal.visible { transform: scale(1); }
    .modal-content { position: relative; padding: 0; }
    .modal-small { width: 400px; }
    .modal-medium { width: 600px; }
    .modal-large { width: 800px; }
    .modal-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 600; color: #2c2c2c; margin: 0; padding: 24px 24px 0 24px; }
    .modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; color: #8b7d6b; cursor: pointer; padding: 8px; border-radius: 50%; transition: all .2s ease; z-index: 10; }
    .modal-close:hover { background: rgba(139,125,107,.1); color: #6b5b47; }
    .modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }
    @media (max-width: 768px) {
      .modal-overlay { padding: 16px; }
      .modal-small, .modal-medium, .modal-large { width: 100%; max-width: none; }
      .modal-title { font-size: 20px; padding: 20px 20px 0 20px; }
      .modal-body { padding: 20px; }
      .modal-close { top: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);
}
