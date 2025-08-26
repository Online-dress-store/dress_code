# Refactor Notes

This refactor introduces a shared front-end module structure and page-level ES modules.

## Shared Modules (public/shared)

- dom.js: qs/qsa/on/create helpers
- storage.js: localStorage helpers + key constants
- auth.js: getCurrentUser, requireLogin, logout
- api.js: products fetch, saveOrder, fetchOrders
- cart.js: add/remove/update, totals, isInCart
- wishlist.js: wishlist operations
- renderCard.js: reusable product card renderer
- modal.js: reusable modal (moved from previous global)

## Pages

Each page should use a folder with index.html, index.js, styles.css and import shared modules with type="module".

## Notes

- No features changed. Logic deduplicated, large files to be migrated progressively.
- Categories page should import shared modules and use renderCard + modal for Quick View.

## Completed Tasks

- [x] Created `/public/shared` folder structure
- [x] Scaffolded shared modules: `dom.js`, `storage.js`, `auth.js`, `api.js`, `cart.js`, `wishlist.js`, `renderCard.js`, `modal.js`
- [x] Added refactor documentation
- [x] Updated categories page to use ES module imports from shared modules
- [x] Removed duplicate functions from categories page (auth, cart, wishlist, message display, product card creation)
- [x] Converted categories page to use `type="module"` and import shared functions
- [x] Updated modal usage to use shared ES module version

## Remaining Tasks

- [ ] Update other pages to use shared modules (home, login, register, cart, wishlist, account, sell, checkout, thankyou)
- [ ] Convert remaining pages to ES modules with `type="module"`
- [ ] Remove old non-module scripts and consolidate shared logic
