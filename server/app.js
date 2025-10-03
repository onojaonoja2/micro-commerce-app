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
// Allow credentials so mobile/web clients can receive/set session cookies
app.set('trust proxy', 1); // if behind a proxy (heroku/nginx) - safe for dev
app.use(cors({ origin: true, credentials: true })); // Allows frontend access and credentials
app.use(cookieParser());
app.use(session({
  // Use a dedicated session secret if available, fallback to JWT_SECRET
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true, // keep so guest sessions can be created
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour
    httpOnly: true,
    sameSite: 'lax', // reasonable default for session cookies
    secure: process.env.NODE_ENV === 'production' // require HTTPS in prod
  }
}));


app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

app.get('/', (req, res) => res.send('API Running'));

module.exports = app;