const request = require('supertest');
const app = require('../app');
const db = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let userToken;

beforeAll(async () => {
  // Create user for testing
  db.exec('DELETE FROM users WHERE email = "user@test.com"');
  const hashed = require('bcrypt').hashSync('userpass', 10);
  db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('user@test.com', hashed, 'user');

  // Token
  const user = { id: 2, role: 'user' }; // Adjust ID
  userToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Seed a product with low stock
  db.prepare('INSERT OR REPLACE INTO products (id, name, price, stock) VALUES (1, "Test Product", 10, 1)').run();
});

describe('Orders API', () => {
  it('should fail order with insufficient stock', async () => {
    // Add to cart more than stock
    await request(app)
      .post('/cart/add')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productId: 1, quantity: 2 });
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Out of stock');
  });
});