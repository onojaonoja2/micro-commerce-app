# Full-Stack Development Assessment: Micro-Commerce App

Your task is to build a basic e-commerce system that allows users to:
* Browse available products
* Add items to a shopping cart
* Place an order (mocked checkout – no actual payment integration)

This project reflects real-world functionality you would likely work on if you join the engineering team at Kenkeputa.

---

## Requirements

You may choose from the following technologies:
* **Frontend:** React Native (Expo) or Flutter
* **Backend:** Node.js (Express/Fastify/Nest) or Python (FastAPI/Flask/Django)
* **Database:** SQLite or Postgres

Structure your solution as a **monorepo** or with separate `/client` and `/server` directories.

---

## Core Features
* **Authentication:** Email/password signup & login (JWT or session)
* **Product Management:** View, filter, and paginate a list of products
* **Cart:** Add/remove items, calculate totals, session-based or user-based
* **Orders:** Create orders, deduct inventory; prevent ordering out-of-stock items
* **Admin Panel (basic):** Create, edit, delete products (admin-only access)

---

## Additional Expectations
* Server-side validation and meaningful error handling
* At least 5 relevant backend tests (auth, CRUD, edge cases)
* Seed/demo data (script or JSON)
* Clear, organized codebase with useful commit history
* A detailed **README.md** with:
    * Setup and run instructions
    * API endpoints and example requests/responses
    * Technology stack used and any known limitations

---

## What to Submit

When you're done, please share:
* A **GitHub repo link** (or zipped folder if necessary)
* **.env.example** file and setup/seed instructions
* (Optional) A short screen recording (2–5 mins) showing the core flow

---

