require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/stores', require('./src/routes/user'));
app.use('/api/owner', require('./src/routes/owner'));

// Unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// The frontend is plain HTML/CSS/JS, so Express can serve it directly
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
