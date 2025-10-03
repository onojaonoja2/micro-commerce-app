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

Further improvements (suggested)
- Move secrets to a secure store for production.
- Add CI (GitHub Actions) to run tests and migrations.
- Add more comprehensive end-to-end tests for client flows.

Contact
- For local help, ensure your device and server are on the same LAN if using Expo Go (set API_BASE to machine IP).
