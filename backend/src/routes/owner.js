const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { buildOrder } = require('../utils');

const router = express.Router();
router.use(authenticate, requireRole('owner'));

// Store owner dashboard: average rating + who rated the store
router.get('/dashboard', async (req, res, next) => {
  try {
    const [stores] = await db.query('SELECT id, name, address FROM stores WHERE owner_id = ?', [req.user.id]);
    if (!stores.length) return res.json({ store: null, average: null, total: 0, raters: [] });

    const store = stores[0];
    const orderBy = buildOrder(
      { name: 'u.name', email: 'u.email', rating: 'r.rating', date: 'r.updated_at' },
      req.query.sort, req.query.order, 'date'
    );

    const [raters] = await db.query(
      `SELECT u.id, u.name, u.email, u.address, r.rating, r.updated_at AS ratedOn
       FROM ratings r JOIN users u ON u.id = r.user_id
       WHERE r.store_id = ? ${orderBy}`,
      [store.id]
    );
    const [[summary]] = await db.query(
      'SELECT ROUND(AVG(rating), 1) AS average, COUNT(*) AS total FROM ratings WHERE store_id = ?',
      [store.id]
    );

    res.json({ store, average: summary.average, total: summary.total, raters });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
