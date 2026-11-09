# CircuitGuard

A React workspace with an Express API, PostgreSQL database, and a Python PCB design-rule checking service. Signed-in users can upload manufacturing Gerbers or run KiCad's native, net-aware DRC on a KiCad project ZIP, then review the saved report and board preview.

## Build separate Docker images

The frontend and backend have independent build contexts and Dockerfiles.

Build the backend image from the project root:

```sh
docker build -t circuitguard-backend:latest ./backend
```

Build the frontend image:

```sh
docker build -t circuitguard-frontend:latest ./frontend
```

Confirm that both images exist:

```sh
docker image ls circuitguard-backend
docker image ls circuitguard-frontend
```

The backend image expects its database and security settings at runtime. The frontend image serves the compiled React application with Nginx and accepts `BACKEND_URL` as a runtime environment variable.

## Run the complete stack with Docker Compose

Copy `.env.example` to `.env`, replace both secrets, then run:

```sh
docker compose up --build
```

Open <http://localhost:8080>. Create an account from the login screen, then sign in with the stored credentials.

Compose builds the frontend, Node.js API, and Python DRC engine images and also starts PostgreSQL. The DRC engine image is based on KiCad's official command-line image and is larger than a Python-only image. The root `.env` should contain:

```env
POSTGRES_PASSWORD=use-a-url-safe-database-password
JWT_SECRET=replace-with-a-long-random-secret
```

Do not commit the real `.env` file.

## Run the images manually

Create a private Docker network:

```sh
docker network create circuitguard-network
```

Start PostgreSQL:

```sh
docker run -d --name circuitguard-db --network circuitguard-network \
  -e POSTGRES_DB=circuitguard \
  -e POSTGRES_USER=circuitguard \
  -e POSTGRES_PASSWORD=your_database_password \
  -v circuitguard-postgres:/var/lib/postgresql/data \
  postgres:17-alpine
```

Start the backend after PostgreSQL is ready:

```sh
docker run -d --name circuitguard-api --network circuitguard-network \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://circuitguard:your_database_password@circuitguard-db:5432/circuitguard \
  -e JWT_SECRET=your_long_random_secret \
  -e FRONTEND_ORIGIN=http://localhost:8080 \
  -e DATABASE_SSL=false \
  -e COOKIE_SECURE=false \
  circuitguard-backend:latest
```

Start the frontend and point its Nginx proxy at the backend container:

```sh
docker run -d --name circuitguard-web --network circuitguard-network \
  -p 8080:80 \
  -e BACKEND_URL=http://circuitguard-api:3000 \
  circuitguard-frontend:latest
```

Open <http://localhost:8080>.

On Windows Command Prompt, place each `docker run` command on one line or replace the shell continuation characters with CMD continuation characters (`^`).

## What each Dockerfile does

### Frontend

1. Starts from a Node.js build image.
2. Installs exact dependencies from `package-lock.json` with `npm ci`.
3. Builds the production React bundle with Vite.
4. Copies only the generated bundle into a small Nginx image.
5. Proxies `/api` requests to the runtime `BACKEND_URL`.

### Backend

1. Starts from the Node.js Alpine image.
2. Installs production dependencies with `npm ci --omit=dev`.
3. Copies only the server source code.
4. Runs as the non-root `node` user.
5. Exposes port `3000` and includes an API health check.

## Run locally

1. Start PostgreSQL and create a `circuitguard` database.
2. Copy `backend/.env.example` to `backend/.env` and set its database connection and JWT secret.
3. Install KiCad 9 or newer so `kicad-cli` is on PATH. In `backend-fastapi`, create/activate a Python virtual environment, install `requirements.txt`, then run `uvicorn main:app --reload --host 0.0.0.0 --port 8000`. If the executable is elsewhere, set `KICAD_CLI_PATH` to its full path.
4. In `backend`, run `npm install` and `npm run dev`.
5. In `frontend`, run `npm install` and `npm run dev`.

The frontend runs on <http://localhost:5173> and proxies `/api` requests to <http://localhost:3000>. The API connects to the DRC engine at `http://localhost:8000` by default. The API creates the standard fabrication profile on startup; DRC job history is saved per user in PostgreSQL.

## PCB upload and DRC scope

- `POST /api/drc/validate` accepts an authenticated multipart upload with `file` (ZIP), `analysisMode` (`GERBER` or `KICAD`), and a `profileId` for Gerber mode. Uploads are limited to 25 MB.
- `GET /api/drc/profiles` returns available rule profiles; `GET /api/drc/jobs` returns recent job summaries; `GET /api/drc/jobs/:jobId` returns a saved report and its board preview.
- The Python service parses common RS-274X Gerber and Excellon files, checks minimum trace width, copper clearance, and limited circular-pad annular rings, then returns simplified copper-layer paths for the interactive board view. It returns warnings for unsupported/approximate cases.
- KiCad mode requires exactly one `.kicad_pcb` file in the ZIP. Include matching `.kicad_pro` and `.kicad_dru` files to carry project settings and custom design rules; include a matching `.kicad_sch` to request schematic parity checks. The service runs KiCad CLI's PCB DRC with JSON output and exports copper layers for the board preview. This adds KiCad's net/connectivity checks, including unconnected items and shorts, along with board setup rules. KiCad must be installed locally for local development; the Compose engine image includes KiCad CLI.
- Gerber files contain manufacturing geometry, not schematic net intent. Use KiCad mode with the source project when checking connectivity, ground nets, shorts, and unconnected items.
- This is an early geometry-based checker, not a manufacturing-certified DRC tool. Verify results in a PCB CAD tool and with your fabricator before ordering boards.

## Authentication

- Passwords are hashed with bcrypt and never returned by the API.
- The signed session token is stored in an HTTP-only, SameSite cookie.
- Login and registration endpoints are rate-limited.
- The API creates the `users` table when it starts.

For an HTTPS deployment, set `COOKIE_SECURE=true`. Use a proper migration tool before evolving the production schema beyond this initial table.
