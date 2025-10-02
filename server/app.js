const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const db = require('./db');
const productRoutes = require('./routes/products');
const session = require('express-session');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');


const app = express();
app.use(express.json());
app.use(cors({ origin: true })); // Allows frontend access; flexible for dev
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET, // Reuse for simplicity
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));


app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

app.get('/', (req, res) => res.send('API Running'));

module.exports = app;