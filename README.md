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
