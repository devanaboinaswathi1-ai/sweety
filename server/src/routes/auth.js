const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const sign = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({
      error: 'Name, email and a password of at least 6 characters are required.',
    });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.toLowerCase().trim(), hash]
    );
    res.status(201).json({ user: rows[0], token: sign(rows[0]) });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
      (email || '').toLowerCase().trim(),
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: sign(user),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;