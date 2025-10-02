const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper to get/create cart ID (user or session)
const getCartId = (req) => {
  if (req.user) return `user_${req.user.id}`; // User-based
  if (!req.session.cartId) req.session.cartId = `session_${Date.now()}`;
  return req.session.cartId;
};

// GET /cart - Get cart items and totals
router.get('/', authenticate, (req, res) => {
  try {
    const cartId = getCartId(req);
    const stmt = db.prepare(`
      SELECT ci.id, p.id as productId, p.name, p.price, ci.quantity, (p.price * ci.quantity) as subtotal
      FROM cart_items ci JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `);
    const items = stmt.all(cartId);
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cart/add - Add item
router.post('/add', authenticate, (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const cartId = getCartId(req);
    const productStmt = db.prepare('SELECT stock, price FROM products WHERE id = ?');
    const product = productStmt.get(productId);
    if (!product || product.stock < quantity) return res.status(400).json({ error: 'Out of stock' });

    const cartStmt = db.prepare('INSERT OR REPLACE INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)');
    cartStmt.run(cartId, productId, quantity);
    res.json({ message: 'Added to cart' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /cart/remove - Remove item
router.post('/remove', authenticate, (req, res) => {
  try {
    const { productId } = req.body;
    const cartId = getCartId(req);
    const stmt = db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?');
    stmt.run(cartId, productId);
    res.json({ message: 'Removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;