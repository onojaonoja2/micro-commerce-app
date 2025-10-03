const request = require('supertest');
const app = require('../app');
const db = require('../db');
const bcrypt = require('bcrypt');
require('dotenv').config();

let adminToken;

beforeAll(async () => {
  // Clean relevant tables
  db.exec('DELETE FROM order_items');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM cart_items');
  db.exec('DELETE FROM carts');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM users');

  // Create admin user
  const hashed = bcrypt.hashSync('adminpass', 10);
  const info = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('admin@test.com', hashed, 'admin');
  // ensure admin has a cart
  db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(info.lastInsertRowid);

  // Seed products (create 6 products for pagination test)
  const products = [
    { name: 'P1', description: 'd', price: 1.0, stock: 10 },
    { name: 'P2', description: 'd', price: 2.0, stock: 10 },
    { name: 'P3', description: 'd', price: 3.0, stock: 10 },
    { name: 'P4', description: 'd', price: 4.0, stock: 10 },
    { name: 'P5', description: 'd', price: 5.0, stock: 10 },
    { name: 'P6', description: 'd', price: 6.0, stock: 10 },
  ];
  const stmt = db.prepare('INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)');
  products.forEach(p => stmt.run(p.name, p.description, p.price, p.stock));

  // Login via API to obtain token (use real auth flow)
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@test.com', password: 'adminpass' });
  adminToken = res.body.token;
});

describe('Products API', () => {
  it('should create a product (admin)', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Product', price: 99.99, stock: 5 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should get products with pagination', async () => {
    const res = await request(app)
      .get('/products?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`); // products are public but token is harmless
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(5);
    expect(res.body.total).toBeGreaterThanOrEqual(6);
  });
});