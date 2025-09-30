const db = require('./db');
const bcrypt = require('bcrypt');

const seedUsers = () => {
  const users = [
    { email: 'admin@example.com', password: 'adminpass', role: 'admin' },
    { email: 'user@example.com', password: 'userpass', role: 'user' },
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)');
  users.forEach(user => {
    const hashed = bcrypt.hashSync(user.password, 10);
    stmt.run(user.email, hashed, user.role);
  });
  console.log('Users seeded');
};

seedUsers();