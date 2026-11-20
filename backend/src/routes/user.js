const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { buildOrder } = require('../utils');

const router = express.Router();
router.use(authenticate, requireRole('user'));

// All stores, with overall rating and the logged in user's own rating
router.get('/', async (req, res, next) => {
  try {
    const { name = '', address = '', sort, order } = req.query;
    const orderBy = buildOrder(
      { name: 's.name', address: 's.address', rating: 'overallRating' },
      sort, order, 'name'
    );

    const [stores] = await db.query(
      `SELECT s.id, s.name, s.address,
              ROUND(AVG(r.rating), 1) AS overallRating,
              COUNT(r.id) AS totalRatings,
              (SELECT rating FROM ratings WHERE store_id = s.id AND user_id = ?) AS myRating
       FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.name LIKE ? AND s.address LIKE ?
       GROUP BY s.id ${orderBy}`,
      [req.user.id, `%${name}%`, `%${address}%`]
    );
    res.json(stores);
  } catch (err) {
    next(err);
  }
});

// Submit a new rating or change the old one (same endpoint)
router.post('/:id/rating', async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    const [store] = await db.query('SELECT id FROM stores WHERE id = ?', [req.params.id]);
    if (!store.length) return res.status(404).json({ message: 'Store not found' });

    await db.query(
      `INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [req.user.id, req.params.id, rating]
    );
    res.json({ message: 'Your rating has been saved' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
