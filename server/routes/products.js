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

// GET /products - List with filter/pagination (now public)
router.get('/', (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { name, minPrice, maxPrice } = req.query;

    // Build reusable WHERE clause and params for both select and count
    let where = '1=1';
    const params = [];

    if (name) {
      where += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    if (minPrice !== undefined) {
      const mp = parseFloat(minPrice);
      if (!Number.isNaN(mp)) {
        where += ' AND price >= ?';
        params.push(mp);
      }
    }
    if (maxPrice !== undefined) {
      const xp = parseFloat(maxPrice);
      if (!Number.isNaN(xp)) {
        where += ' AND price <= ?';
        params.push(xp);
      }
    }

    const selectQuery = `SELECT * FROM products WHERE ${where} LIMIT ? OFFSET ?`;
    const selectParams = params.concat([limit, offset]);
    const products = db.prepare(selectQuery).all(...selectParams);

    const countQuery = `SELECT COUNT(*) as total FROM products WHERE ${where}`;
    const { total } = db.prepare(countQuery).get(...params);

    res.json({ products, total, page, limit });
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