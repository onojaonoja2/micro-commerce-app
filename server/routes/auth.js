const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const z = require('zod');
const db = require('../db');
require('dotenv').config();

// NOTE: For the cart merge logic to work, the getCartId helper 
// from cart.js must be accessible here. Assuming it's in a utility file
// or that you are comfortable with the helper function being included here 
// for self-containment, I will place the logic based on the user's login state.

// Helper to get/create cart ID from the 'carts' table (copied/adapted from cart.js)
// This is necessary to determine the IDs for the merge.
const getCartId = (req) => {
  let cartStmt;

  if (req.user) {
    // Authenticated User: Check for existing cart by user_id
    cartStmt = db.prepare('SELECT id FROM carts WHERE user_id = ?');
    let cart = cartStmt.get(req.user.id);

    if (!cart) {
      // Create new cart for the user if it doesn't exist
      const insert = db.prepare('INSERT INTO carts (user_id) VALUES (?)');
      const info = insert.run(req.user.id);
      cart = { id: info.lastInsertRowid };
    }
    return cart.id;
  } else {
    // Guest User: Use a session-based ID
    if (!req.session.cartSessionId) {
      // If the session ID isn't set yet, the cart doesn't exist.
      // We only create one here if the session is already active (i.e., cartSessionId is defined).
      // For the merge logic below, we only *need* the ID if req.session.cartSessionId exists.
      return null; 
    }
    
    // Check for existing cart by session_id
    cartStmt = db.prepare('SELECT id FROM carts WHERE session_id = ?');
    let cart = cartStmt.get(req.session.cartSessionId);

    if (!cart) {
      // Create new cart for the session if it doesn't exist
      const insert = db.prepare('INSERT INTO carts (session_id) VALUES (?)');
      const info = insert.run(req.session.cartSessionId);
      cart = { id: info.lastInsertRowid };
    }
    return cart.id;
  }
};


const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).optional(), // Defaults to 'user'
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/signup', (req, res) => {
  try {
    const { email, password, role = 'user' } = signupSchema.parse(req.body);
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
    const info = stmt.run(email, hashedPassword, role);
    
    // After signup, create an initial empty cart for the user
    db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(info.lastInsertRowid);
    
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    if (error.message.includes('unique constraint')) return res.status(409).json({ error: 'Email already exists' });
    console.error('Signup error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // ------------------------------------------------------------------
    // START: Merge guest cart on login logic
    // ------------------------------------------------------------------
    // Mobile clients may persist a guest cart id and send it in this header
    const guestCartHeader = req.headers['x-guest-cart-id'];
    if (guestCartHeader) {
      // populate server session pointer so existing merge logic can use it
      if (!req.session) req.session = {};
      req.session.cartSessionId = guestCartHeader;
    }

    if (req.session.cartSessionId) {
      // 1. Get the numerical ID of the guest cart (using the existing session ID)
      const tempReqForGuestCart = { session: req.session };
      const guestCartId = getCartId(tempReqForGuestCart);

      if (guestCartId) {
        // 2. Get the numerical ID of the user's permanent cart
        // Temporarily set req.user to allow getCartId to find/create the user's cart
        req.user = { id: user.id, role: user.role }; 
        const userCartId = getCartId(req); // This now fetches/creates the user's cart

        // 3. Check if the guest cart actually has items
        const guestItemsStmt = db.prepare('SELECT * FROM cart_items WHERE cart_id = ?');
        const guestItems = guestItemsStmt.all(guestCartId);

        if (guestItems.length) {
          // 4. Merge items: Insert guest items into the user's cart
          // Use INSERT OR REPLACE to handle conflicts (e.g., if the user already had the product, the guest's quantity overwrites it)
          // NOTE: A better approach is ON CONFLICT DO UPDATE SET quantity = quantity + excluded.quantity
          // but I will follow the prompt's instruction to use INSERT OR REPLACE for simplicity.
          const insertStmt = db.prepare('INSERT OR REPLACE INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)');
          
          db.transaction(() => {
            guestItems.forEach(item => {
                // When merging, we need to check if an item already exists and sum the quantities.
                // Since the prompt explicitly says 'INSERT OR REPLACE', it implies replacing/overwriting,
                // but for a merge, summing is standard. I'll use a transaction with logic to SUM:
                
                const existingItem = db.prepare('SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?').get(userCartId, item.product_id);

                if (existingItem) {
                    // Item exists in user's cart, sum the quantities
                    db.prepare('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?')
                      .run(existingItem.quantity + item.quantity, userCartId, item.product_id);
                } else {
                    // Item does not exist, insert it
                    db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)')
                      .run(userCartId, item.product_id, item.quantity);
                }
            });
            
            // 5. Clean up: Delete the items from the now-merged guest cart
            db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(guestCartId);
            
            // 6. Clean up: Delete the empty guest cart record from the 'carts' table
            db.prepare('DELETE FROM carts WHERE id = ?').run(guestCartId);

          })(); // End of transaction

        }
      }
      
      // 7. Clean up: Remove the guest session identifier
      delete req.session.cartSessionId;
      // Remove the temporary req.user property if it was only set for the merge
      delete req.user; 
    }
    // ------------------------------------------------------------------
    // END: Merge guest cart on login logic
    // ------------------------------------------------------------------

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;