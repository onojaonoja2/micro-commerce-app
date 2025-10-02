const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const db = require('./db');
const productRoutes = require('./routes/products');


const app = express();
app.use(express.json());
app.use(cors({ origin: true })); // Allows frontend access; flexible for dev
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/products', productRoutes);

app.get('/', (req, res) => res.send('API Running'));

module.exports = app;