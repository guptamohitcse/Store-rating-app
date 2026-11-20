const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateUser, validateStore } = require('../validators');
const { createUser } = require('../userService');
const { buildOrder } = require('../utils');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

const ROLES = ['admin', 'user', 'owner'];

// Dashboard numbers
router.get('/stats', async (req, res, next) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users)   AS totalUsers,
        (SELECT COUNT(*) FROM stores)  AS totalStores,
        (SELECT COUNT(*) FROM ratings) AS totalRatings
    `);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// List users with filters + sorting
router.get('/users', async (req, res, next) => {
  try {
    const { name = '', email = '', address = '', role = '', sort, order } = req.query;
    const where = ['u.name LIKE ?', 'u.email LIKE ?', 'u.address LIKE ?'];
    const params = [`%${name}%`, `%${email}%`, `%${address}%`];
    if (ROLES.includes(role)) {
      where.push('u.role = ?');
      params.push(role);
    }

    const orderBy = buildOrder(
      { name: 'u.name', email: 'u.email', address: 'u.address', role: 'u.role' },
      sort, order, 'name'
    );

    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.address, u.role,
         (SELECT ROUND(AVG(r.rating), 1) FROM ratings r
            JOIN stores s ON s.id = r.store_id WHERE s.owner_id = u.id) AS rating
       FROM users u WHERE ${where.join(' AND ')} ${orderBy}`,
      params
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Details of one user (store owners also get their store rating)
router.get('/users/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.address, u.role,
         (SELECT ROUND(AVG(r.rating), 1) FROM ratings r
            JOIN stores s ON s.id = r.store_id WHERE s.owner_id = u.id) AS rating
       FROM users u WHERE u.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Admin adds a user (any role)
router.post('/users', async (req, res, next) => {
  try {
    const errors = validateUser(req.body);
    if (!ROLES.includes(req.body.role)) errors.push('Please choose a valid role');
    if (errors.length) return res.status(400).json({ message: 'Please fix the errors', errors });

    const result = await createUser(req.body);
    if (result.error) return res.status(400).json({ message: result.error });

    res.status(201).json({ message: 'User added successfully', id: result.id });
  } catch (err) {
    next(err);
  }
});

// List stores with filters + sorting
router.get('/stores', async (req, res, next) => {
  try {
    const { name = '', email = '', address = '', sort, order } = req.query;
    const orderBy = buildOrder(
      { name: 's.name', email: 's.email', address: 's.address', rating: 'rating' },
      sort, order, 'name'
    );

    const [stores] = await db.query(
      `SELECT s.id, s.name, s.email, s.address,
              ROUND(AVG(r.rating), 1) AS rating, COUNT(r.id) AS totalRatings
       FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.name LIKE ? AND s.email LIKE ? AND s.address LIKE ?
       GROUP BY s.id ${orderBy}`,
      [`%${name}%`, `%${email}%`, `%${address}%`]
    );
    res.json(stores);
  } catch (err) {
    next(err);
  }
});

// Owners that don't have a store yet (for the "add store" dropdown)
router.get('/owners/available', async (req, res, next) => {
  try {
    const [owners] = await db.query(
      `SELECT u.id, u.name, u.email FROM users u
       WHERE u.role = 'owner' AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.owner_id = u.id)
       ORDER BY u.name`
    );
    res.json(owners);
  } catch (err) {
    next(err);
  }
});

router.post('/stores', async (req, res, next) => {
  try {
    const errors = validateStore(req.body);
    if (errors.length) return res.status(400).json({ message: 'Please fix the errors', errors });

    const { name, email, address } = req.body;
    const ownerId = req.body.ownerId ? Number(req.body.ownerId) : null;

    const [sameEmail] = await db.query('SELECT id FROM stores WHERE email = ?', [email.trim().toLowerCase()]);
    if (sameEmail.length) return res.status(400).json({ message: 'A store with this email already exists' });

    if (ownerId) {
      const [owner] = await db.query("SELECT id FROM users WHERE id = ? AND role = 'owner'", [ownerId]);
      if (!owner.length) return res.status(400).json({ message: 'Selected owner is not valid' });
      const [taken] = await db.query('SELECT id FROM stores WHERE owner_id = ?', [ownerId]);
      if (taken.length) return res.status(400).json({ message: 'This owner already has a store' });
    }

    await db.query('INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)', [
      name.trim(), email.trim().toLowerCase(), address.trim(), ownerId,
    ]);
    res.status(201).json({ message: 'Store added successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
