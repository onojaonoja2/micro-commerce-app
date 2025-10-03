const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Auth API', () => {
  const testEmail = `test+${Date.now()}@example.com`;

  afterAll(() => {
    // cleanup created user and dependent rows (carts, cart_items, orders, etc.)
    // Find user id(s) for the test email
    const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(testEmail);
    if (userRow && userRow.id) {
      const uid = userRow.id;
      // Remove dependent rows in correct order to satisfy foreign keys
      db.prepare('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)').run(uid);
      db.prepare('DELETE FROM carts WHERE user_id = ?').run(uid);
      db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)').run(uid);
      db.prepare('DELETE FROM orders WHERE user_id = ?').run(uid);
      db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    } else {
      // fallback: try delete by email if no id found (idempotent)
      db.prepare('DELETE FROM users WHERE email = ?').run(testEmail);
    }
  });

  it('should signup a new user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: testEmail, password: 'testpass' });
    expect(res.statusCode).toBe(201);
  });

  it('should fail login with invalid creds', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'invalid@example.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});