const request = require('supertest');
const app = require('../app');
const db = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let adminToken;

beforeAll(async () => {
  // Create admin for testing
  db.exec('DELETE FROM users WHERE email = "admin@test.com"');
  const hashed = require('bcrypt').hashSync('adminpass', 10);
  db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('admin@test.com', hashed, 'admin');

  // Generate token
  const user = { id: 1, role: 'admin' }; // Adjust ID if needed
  adminToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('Products API', () => {
  it('should create a product (admin)', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Product', price: 99.99, stock: 5 });
    expect(res.statusCode).toBe(201);
  });

  it('should get products with pagination', async () => {
    const res = await request(app)
      .get('/products?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(5);
  });
});