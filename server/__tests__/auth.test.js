const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Auth API', () => {
  beforeEach(() => {
    const stmt = db.prepare('DELETE FROM users WHERE email = ?');
    stmt.run('test@example.com'); // Bind parameter safely
  });

  it('should signup a new user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'test@example.com', password: 'testpass' });
    expect(res.statusCode).toBe(201);
  });

  it('should fail login with invalid creds', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'invalid@example.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});