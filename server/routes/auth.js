const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const z = require('zod');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).optional(), // Defaults to 'user'
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/signup', (req, res) => {
  try {
    const { email, password, role = 'user' } = signupSchema.parse(req.body);
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
    stmt.run(email, hashedPassword, role);
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    if (error.message.includes('unique constraint')) return res.status(409).json({ error: 'Email already exists' });
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;