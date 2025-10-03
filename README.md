# Nexcom — Micro-Commerce App

Short overview
- Full-stack demo: Express + better-sqlite3 backend, Expo (React Native) client.
- Features: signup/login (JWT), product list, cart (guest + user), orders, admin CRUD.

Quick setup (server)
1. cd server
2. npm install
3. Copy `.env.example` to `.env` and set JWT_SECRET (and optionally DB_PATH).
4. Seed demo data:
   - `node seed.js`
5. Run migrations (adds unique cart index and consolidates duplicates):
   - `npm run migrate`
6. Start server:
   - Dev: `npm run dev`
   - Prod: `npm start`

Quick setup (client)
1. cd client
2. npm install
3. Configure API endpoint:
   - Edit `client/app.json` -> `expo.extra.API_BASE` to match your server URL (e.g. `http://192.168.0.114:3000`).
   - Alternatively, change in code fallback inside `client/utils/api.js`.
4. Start Expo:
   - `npm start` (or `expo start`)
5. Rebuild/reload the app in Expo Go or emulator.

Important notes
- The client reads API_BASE at runtime from `Constants.manifest.extra.API_BASE`. Update `client/app.json` before starting the client so the proper backend URL is used.
- Guest cart persistence: the app stores a server-provided `guestCartId` in SecureStore and sends it via `x-guest-cart-id` header; this allows mobile clients to persist carts without cookies.
- Database changes:
  - A migration script `server/migrations/001-add-unique-cart-product.js` consolidates duplicate cart_items and creates a unique index.
  - If you run into migration errors, ensure no long-running server process holds DB locks.

Testing
- Server tests use Jest + supertest. From /server run:
  - `npm test`
- Tests are isolated (create/cleanup rows). If a test fails with FK errors, check DB state and re-run migrations + seed.

Contact
- For local help, ensure your device and server are on the same LAN if using Expo Go (set API_BASE to machine IP).

## API Endpoints (Postman examples)

Base URL: http://{SERVER_HOST}:3000
Headers commonly used:
- Content-Type: application/json
- Authorization: Bearer <JWT> (when required)

1) Signup
- Request (POST /auth/signup)
  - URL: POST http://localhost:3000/auth/signup
  - Body (JSON):
    {
      "email": "alice@example.com",
      "password": "secret123"
    }
- Example Response (201):
  {
    "message": "User created"
  }

2) Login
- Request (POST /auth/login)
  - URL: POST http://localhost:3000/auth/login
  - Body (JSON):
    {
      "email": "alice@example.com",
      "password": "secret123"
    }
- Example Response (200):
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }

3) List Products (public)
- Request (GET /products)
  - URL: GET http://localhost:3000/products?page=1&limit=10&name=phone&minPrice=100&maxPrice=1000
- Example Response (200):
  {
    "products": [
      { "id": 1, "name": "Phone", "description": "Smartphone", "price": 499.99, "stock": 20 },
      ...
    ],
    "total": 42,
    "page": 1,
    "limit": 10
  }

4) Create Product (admin)
- Request (POST /products) — requires admin JWT
  - Headers: Authorization: Bearer <admin-token>
  - Body (JSON):
    { "name": "New Product", "description": "desc", "price": 9.99, "stock": 10 }
- Example Response (201):
  { "id": 123 }

5) Edit Product (admin)
- Request (PUT /products/:id)
  - Headers: Authorization: Bearer <admin-token>
  - URL: PUT http://localhost:3000/products/123
  - Body (JSON): same shape as create
- Example Response (200):
  { "message": "Product updated" }

6) Delete Product (admin)
- Request (DELETE /products/:id)
  - Headers: Authorization: Bearer <admin-token>
- Example Response (200):
  { "message": "Product deleted" }

7) Get Cart
- Request (GET /cart)
  - For guests: include header x-guest-cart-id with stored guest id OR rely on persisted SecureStore header sent by client
  - For auth: include Authorization header
- Example Response (200):
  {
    "items": [
      { "id": 5, "productId": 2, "name": "Phone", "price": 499.99, "quantity": 1, "subtotal": 499.99 }
    ],
    "total": 499.99,
    "sessionId": "session_163..." // store this as guestCartId in client
  }

8) Add to Cart
- Request (POST /cart/add)
  - Body (JSON): { "productId": 2, "quantity": 1 }
  - Headers: Authorization or x-guest-cart-id (client sends both if available)
- Example Success (200):
  { "message": "Added to cart", "sessionId": "session_163..." }
- Example Failure (400 - out of stock):
  { "error": "Product out of stock" }

9) Update Cart Item Quantity
- Request (POST /cart/update)
  - Body (JSON): { "productId": 2, "quantity": 3 } // quantity 0 removes item
- Example Success (200):
  { "message": "Cart updated", "sessionId": "session_163..." }
- Example Failure (400 - out of stock):
  { "error": "Product out of stock" }

10) Remove from Cart
- Request (POST /cart/remove)
  - Body (JSON): { "productId": 2 }
- Example Response (200):
  { "message": "Removed from cart", "sessionId": "session_163..." }

11) Create Order (checkout) — must be authenticated
- Request (POST /orders)
  - Headers: Authorization: Bearer <user-token>
- Example Success (201):
  { "message": "Order placed", "orderId": 456 }
- Example Failure (400 - out of stock):
  { "error": "Product out of stock" }

12) List Orders (authenticated, paginated)
- Request (GET /orders?page=1&limit=10)
  - Headers: Authorization: Bearer <user-token>
- Example Response (200):
  {
    "orders": [
      { "id": 456, "total": 499.99, "created_at": "2023-01-01 12:00:00", "item_count": 2 }
    ],
    "total": 3,
    "page": 1,
    "limit": 10
  }

13) Order Details (authenticated)
- Request (GET /orders/:id)
  - Headers: Authorization: Bearer <user-token>
- Example Response (200):
  {
    "order": { "id": 456, "total": 499.99, "created_at": "2023-01-01 12:00:00" },
    "items": [
      { "product_id": 2, "name": "Phone", "quantity": 1, "price": 499.99, "subtotal": 499.99 }
    ]
  }

Postman tips
- Use the Authorization tab -> Bearer Token to paste tokens from login.
- Save the `sessionId` value returned by /cart (store in environment variable "guestCartId") and send it as header `x-guest-cart-id` for guest flows.
- When testing admin endpoints, create an admin user via seed or change role in DB, then login to obtain a token.


