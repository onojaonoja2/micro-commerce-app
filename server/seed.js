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

const seedProducts = () => {
  const products = [
    { name: 'Laptop', description: 'High-end laptop', price: 999.99, stock: 10 },
    { name: 'Phone', description: 'Smartphone', price: 499.99, stock: 20 },
    { name: 'Headphones', description: 'Noise-cancelling', price: 199.99, stock: 15 },
    { name: 'Keyboard', description: 'Mechanical keyboard', price: 89.99, stock: 30 },
    { name: 'Mouse', description: 'Wireless mouse', price: 49.99, stock: 25 },
    { name: 'Monitor', description: '4K monitor', price: 299.99, stock: 8 },
    { name: 'Tablet', description: 'Drawing tablet', price: 399.99, stock: 12 },
    { name: 'Speaker', description: 'Bluetooth speaker', price: 79.99, stock: 18 },
    { name: 'Charger', description: 'Fast charger', price: 29.99, stock: 50 },
    { name: 'Backpack', description: 'Laptop backpack', price: 59.99, stock: 22 },
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)');
  products.forEach(p => stmt.run(p.name, p.description, p.price, p.stock));
  console.log('Products seeded');
};

seedProducts();