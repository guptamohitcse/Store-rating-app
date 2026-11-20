const bcrypt = require('bcryptjs');
const db = require('./db');

// Used by both public signup and the admin "add user" form
async function createUser({ name, email, address, password, role }) {
  const cleanEmail = email.trim().toLowerCase();
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (existing.length) return { error: 'This email is already registered' };

  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), cleanEmail, hash, address.trim(), role]
  );
  return { id: result.insertId };
}

module.exports = { createUser };
