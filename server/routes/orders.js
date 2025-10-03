const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /orders - Create order from cart
router.post('/', authenticate, (req, res) => {
  const transaction = db.transaction(() => {
    try {
      // Look up the numeric cart id associated with this authenticated user
      const cartRow = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(req.user.id);
      if (!cartRow) throw new Error('Cart empty');
      const cartId = cartRow.id;
      const cartItemsStmt = db.prepare(`
        SELECT ci.product_id, ci.quantity, p.price, p.stock
        FROM cart_items ci JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
      `);
      const items = cartItemsStmt.all(cartId);
      if (!items.length) throw new Error('Cart empty');

      // Check stock
      items.forEach(item => {
        if (item.stock < item.quantity) throw new Error(`Out of stock for product ${item.product_id}`);
      });

      // Create order
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const orderStmt = db.prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)');
      const orderInfo = orderStmt.run(req.user.id, total);
      const orderId = orderInfo.lastInsertRowid;

      // Add order items and deduct stock
      const orderItemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
      const stockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
      items.forEach(item => {
        orderItemStmt.run(orderId, item.product_id, item.quantity, item.price);
        stockStmt.run(item.quantity, item.product_id);
      });

      // Clear cart
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartId);

      return { orderId };
    } catch (error) {
      throw error; // Rolls back transaction
    }
  });

  try {
    const { orderId } = transaction();
    res.status(201).json({ message: 'Order placed', orderId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;