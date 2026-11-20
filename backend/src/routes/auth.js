const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validateUser, passwordError } = require('../validators');
const { createUser } = require('../userService');

const router = express.Router();

// Normal users sign up here (role is always "user")
router.post('/signup', async (req, res, next) => {
  try {
    const errors = validateUser(req.body);
    if (errors.length) return res.status(400).json({ message: 'Please fix the errors', errors });

    const result = await createUser({ ...req.body, role: 'user' });
    if (result.error) return res.status(400).json({ message: result.error });

    res.status(201).json({ message: 'Account created! You can log in now.' });
  } catch (err) {
    next(err);
  }
});

// One login for everybody - the role decides where they go in the frontend
router.post('/login', async (req, res, next) => {
  try {
    const { email = '', password = '' } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Wrong email or password' });
    }

    const payload = { id: user.id, role: user.role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1d' });
    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

// Any logged in user (admin / user / owner) can change their own password
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword = '', newPassword = '' } = req.body;

    const problem = passwordError(newPassword);
    if (problem) return res.status(400).json({ message: problem });

    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
