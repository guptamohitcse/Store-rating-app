
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  await conn.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log('Tables are ready.');

  const addUser = async (name, email, password, address, role) => {
    const hash = await bcrypt.hash(password, 10);
    await conn.query(
      'INSERT IGNORE INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, address, role]
    );
    const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    return rows[0].id;
  };

  await addUser('System Administrator Account', 'admin@storerating.com', 'Admin@123', 'Head Office, Bengaluru', 'admin');
  const ownerId = await addUser('Demo Store Owner Account', 'owner@storerating.com', 'Owner@123', '12 Market Road, Bengaluru', 'owner');
  const userId = await addUser('Demo Normal User Account', 'user@storerating.com', 'User@1234', '45 Lake View Street, Bengaluru', 'user');

  await conn.query(
    'INSERT IGNORE INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
    ['Fresh Groceries Supermarket Store', 'fresh@store.com', '12 Market Road, Bengaluru', ownerId]
  );
  await conn.query(
    'INSERT IGNORE INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, NULL)',
    ['City Books and Stationery Corner', 'books@store.com', '8 Church Street, Bengaluru']
  );
  const [[store]] = await conn.query('SELECT id FROM stores WHERE email = ?', ['fresh@store.com']);
  await conn.query('INSERT IGNORE INTO ratings (user_id, store_id, rating) VALUES (?, ?, 4)', [userId, store.id]);

  console.log('\nDone! Default logins:');
  console.log('  Admin : admin@storerating.com / Admin@123');
  console.log('  Owner : owner@storerating.com / Owner@123');
  console.log('  User  : user@storerating.com  / User@1234');
  await conn.end();
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
