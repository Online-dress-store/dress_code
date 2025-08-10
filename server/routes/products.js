const router = require('express').Router();
const persist = require('../modules/persist_module');

router.get('/', async (req, res, next) => {
  try {
    const items = await persist.listProducts();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
