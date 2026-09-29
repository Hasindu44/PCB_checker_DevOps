# CircuitGuard

A React workspace with an Express authentication API and PostgreSQL user database.

## Docker setup

Copy `.env.example` to `.env`, replace both secrets, then run:

```sh
docker compose up --build
```

Open <http://localhost:8080>. Create an account from the login screen, then sign in with the stored credentials.

## Run locally

1. Start PostgreSQL and create a `circuitguard` database.
2. Copy `backend/.env.example` to `backend/.env` and update the connection string and JWT secret.
3. Run `npm install` and `npm run dev` inside `backend`.
4. Run `npm install` and `npm run dev` inside `frontend`.

The frontend runs on <http://localhost:5173> and proxies `/api` requests to <http://localhost:3000>.

## Authentication

- Passwords are hashed with bcrypt and never returned by the API.
- The signed session token is stored in an HTTP-only, SameSite cookie.
- Login and registration endpoints are rate-limited.
- The API creates the `users` table when it starts.

For an HTTPS deployment, set `COOKIE_SECURE=true`. Use a proper migration tool before evolving the production schema beyond this initial table.
