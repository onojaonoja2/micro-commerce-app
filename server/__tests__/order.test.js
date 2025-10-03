const request = require('supertest');
const app = require('../app');
const db = require('../db');
const bcrypt = require('bcrypt');
require('dotenv').config();

let userToken;
let userId;

beforeAll(async () => {
  // Clean relevant tables
  db.exec('DELETE FROM order_items');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM cart_items');
  db.exec('DELETE FROM carts');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM users');

  // Create user
  const hashed = bcrypt.hashSync('userpass', 10);
  const info = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('user@test.com', hashed, 'user');
  userId = info.lastInsertRowid;

  // Create cart for user
  const cartInfo = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
  const cartId = cartInfo.lastInsertRowid;

  // Seed a product with low stock
  const prod = db.prepare('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)').run('Test Product', 10, 1);
  const productId = prod.lastInsertRowid;

  // Insert a cart_item with quantity exceeding stock to simulate bad cart state
  db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(cartId, productId, 2);

  // Login via API to obtain token
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'user@test.com', password: 'userpass' });
  userToken = res.body.token;
});

describe('Orders API', () => {
  it('should fail order with insufficient stock', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Out of stock/i);
  });
});