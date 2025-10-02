const express = require('express');
const z = require('zod');
const db = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

// GET /products - List with filter/pagination
router.get('/', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 10, name, minPrice, maxPrice } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const stmt = db.prepare(query);
    const products = stmt.all(...params);

    const countStmt = db.prepare('SELECT COUNT(*) as total FROM products');
    const { total } = countStmt.get();

    res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /products - Create (admin)
router.post('/', authenticate, isAdmin, (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const stmt = db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)');
    const info = stmt.run(data.name, data.description, data.price, data.stock);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /products/:id - Edit (admin)
router.put('/:id', authenticate, isAdmin, (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const stmt = db.prepare('UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?');
    stmt.run(data.name, data.description, data.price, data.stock, req.params.id);
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /products/:id - Delete (admin)
router.delete('/:id', authenticate, isAdmin, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM products WHERE id=?');
    stmt.run(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;