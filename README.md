# Ember Restaurant

Ember is a restaurant ordering and management web app. Customers can browse the menu, place orders, save favorite dishes, and reserve tables. Staff can manage order status, menu availability, and menu items.

## Features

- Role-based customer, chef, and admin experiences
- Menu browsing, favorites, promo codes, and cart
- Dine-in and pickup ordering with order status updates
- Table reservations with availability checks
- MongoDB-backed users, menu items, orders, and reservations

## Tech stack

- React, Vite, and React Router
- Express and Node.js
- MongoDB with Mongoose
- JWT authentication

## Prerequisites

- Node.js and npm
- A MongoDB database (for example, a MongoDB Atlas cluster)

## Getting started

1. Install the dependencies:

   ```sh
   npm install
   ```

2. Create your local environment file. In PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Or in macOS/Linux:

   ```sh
   cp .env.example .env
   ```

3. Edit `.env`:

   - Set `MONGODB_URI` to your MongoDB connection string and use the `ember` database.
   - Generate a strong secret of at least 32 characters for `JWT_SECRET`.
   - Set unique names, email addresses, and strong passwords for `CUSTOMER_*`, `CHEF_*`, and `ADMIN_*`.
   - If your network requires a different DNS configuration for MongoDB SRV lookups, update `MONGODB_DNS_SERVERS`.

   The values in `.env.example` are placeholders. Never commit your `.env` file or put real credentials in `.env.example`.

4. Seed the database:

   ```sh
   npm run seed
   ```

   This creates the initial menu and reference data, plus the customer, chef, and admin accounts configured in `.env`. It does not create sample orders or reservations.

5. Start the API and frontend:

   ```sh
   npm run dev
   ```

   Open the Vite URL printed in the terminal (usually `http://localhost:5173`) and sign in with one of the accounts configured in `.env`. The development server starts the API on port `3001` and proxies `/api` requests to it.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and Vite development server |
| `npm run seed` | Seed MongoDB with initial menu/reference data and configured accounts |
| `npm run build` | Build the frontend into `dist/` |
| `npm run server` | Start the Express server; after a build, it also serves the frontend |
| `npm run preview` | Preview the production frontend build |
| `npm run lint` | Run Oxlint |

For a production-style local run, use `npm run build` followed by `npm run server`.

## Environment variables

See [`.env.example`](./.env.example) for the required variable names and placeholder values. The `.env` file is ignored by Git. Keep database credentials, account passwords, and `JWT_SECRET` private.


<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/51402f0f-28a9-44a4-a10c-fe9fd6c45fa9" />
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/0b40f907-7329-4773-a54e-09d3ff3888c2" />
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/238a56b2-b003-4238-83ae-0c0b88394907" />
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/042e2e80-265a-4b79-96a8-d425fda75ce0" />
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/2260208b-d079-446d-8592-7d227d7ff1c9" />
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/57af6be1-6837-4219-860d-9deb329e4625" />
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/4ed01776-2da2-46f5-b2f0-0bc95435ea09" />
<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/c99ab4bf-2944-45cf-8b2b-220c64368038" />

