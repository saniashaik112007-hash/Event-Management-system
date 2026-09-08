# Event Management System

React/Vite frontend and Express/SQLite API for college event management.

## Local development

1. Install dependencies in both `client` and `server`.
2. Copy `client/.env.example` and `server/.env.example` to `.env` files.
3. Start the API with `npm start` from `server`.
4. Start the frontend with `npm run dev` from `client`.

The frontend uses the Vite proxy at `/api` in development. The API health endpoint is `http://localhost:5000/api/health`.

## Deployment

Deploy `server` as a Node service with `npm start`, a writable persistent directory for `server/db`, and a `PORT` environment variable supplied by the host. Set `CLIENT_URL` to the deployed frontend origin, or to a comma-separated list of allowed origins.

Deploy `client` as a Vite static site with `npm run build`. Set `VITE_API_URL` to the public API origin when the frontend and API are hosted separately. For a same-origin deployment, leave it empty and route `/api` to the Express service.

The SQLite database is intentionally ignored by Git. Run `npm run seed` in the server service when initializing a new deployment.
