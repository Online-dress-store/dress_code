// Tooltip System
export class TooltipManager {
  constructor() {
    this.tooltip = null;
    this.currentTarget = null;
    this.hideTimeout = null;
    this.showTimeout = null;
    this.init();
  }

  init() {
    this.createTooltip();
    this.setupEventListeners();
  }

  createTooltip() {
    // Create tooltip element
    const tooltipHTML = `
      <div id="tooltip" class="tooltip" role="tooltip" aria-hidden="true">
        <div class="tooltip-content"></div>
        <div class="tooltip-arrow"></div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', tooltipHTML);
    this.tooltip = document.getElementById('tooltip');
  }

  setupEventListeners() {
    // Handle tooltip triggers
    document.addEventListener('mouseenter', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.showTooltip(target, target.dataset.tooltip);
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.hideTooltip();
      }
    }, true);

    // Handle focus for accessibility
    document.addEventListener('focusin', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.showTooltip(target, target.dataset.tooltip);
      }
    }, true);

    document.addEventListener('focusout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.hideTooltip();
      }
    }, true);

    // Hide tooltip on scroll
    document.addEventListener('scroll', () => {
      this.hideTooltip();
    }, true);

    // Hide tooltip on resize
    window.addEventListener('resize', () => {
      this.hideTooltip();
    });
  }

  showTooltip(target, text) {
    if (!text || text.trim() === '') return;

    // Clear any existing timeouts
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Set show delay
    this.showTimeout = setTimeout(() => {
      this.currentTarget = target;
      this.tooltip.querySelector('.tooltip-content').textContent = text;
      this.tooltip.setAttribute('aria-hidden', 'false');
      
      // Position tooltip
      this.positionTooltip(target);
      
      // Show tooltip
      this.tooltip.classList.add('tooltip-visible');
    }, 300); // 300ms delay
  }

  hideTooltip() {
    // Clear show timeout if tooltip hasn't shown yet
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    // Set hide delay
    this.hideTimeout = setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.classList.remove('tooltip-visible');
        this.tooltip.setAttribute('aria-hidden', 'true');
        this.currentTarget = null;
      }
    }, 100); // 100ms delay
  }

  positionTooltip(target) {
    const tooltip = this.tooltip;
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Default position (above)
    let top = targetRect.top - tooltipRect.height - 8;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    let arrowClass = 'tooltip-arrow-bottom';

    // Check if tooltip goes off screen
    if (top < 8) {
      // Position below
      top = targetRect.bottom + 8;
      arrowClass = 'tooltip-arrow-top';
    }

    // Check horizontal overflow
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewport.width - 8) {
      left = viewport.width - tooltipRect.width - 8;
    }

    // Apply position
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Update arrow position
    const arrow = tooltip.querySelector('.tooltip-arrow');
    arrow.className = `tooltip-arrow ${arrowClass}`;

    // Center arrow on target
    const arrowLeft = Math.max(8, Math.min(
      targetRect.left + (targetRect.width / 2) - left - 6,
      tooltipRect.width - 16
    ));
    arrow.style.left = `${arrowLeft}px`;
  }

  // Public method to show tooltip programmatically
  show(target, text) {
    this.showTooltip(target, text);
  }

  // Public method to hide tooltip programmatically
  hide() {
    this.hideTooltip();
  }

  // Method to add tooltip to an element
  addTooltip(element, text) {
    element.setAttribute('data-tooltip', text);
  }

  // Method to remove tooltip from an element
  removeTooltip(element) {
    element.removeAttribute('data-tooltip');
  }
}

// Global tooltip manager instance
export const tooltipManager = new TooltipManager();

// Helper function to add tooltips easily
export function addTooltip(element, text) {
  tooltipManager.addTooltip(element, text);
}

// Helper function to remove tooltips
export function removeTooltip(element) {
  tooltipManager.removeTooltip(element);
}
