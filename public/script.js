document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.menu-wrapper');
  const btn = document.querySelector('.menu-btn');
  const menu = document.querySelector('.dropdown-menu');

  if (wrapper && btn && menu) {
    const openMenu = () => {
      wrapper.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    };

    const closeMenu = () => {
      wrapper.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    };

    // Toggle on button click only
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      wrapper.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) closeMenu();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }
});