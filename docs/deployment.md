# Deployment

This project currently ships as a React/Vite frontend and an Express/Prisma backend with PostgreSQL for persistence.

## Local Docker Setup

1. Copy the environment examples into place.
2. Start the stack:

```bash
docker compose up --build
```

This starts:

- `postgres` on port `5432`
- `server` on port `3001`

The compose file uses a named volume called `postgres_data` for persistent database storage.

## Manual Local Setup

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

## Required Environment Variables

### Root Frontend

- `VITE_API_URL`

### Backend

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT`
- `CLIENT_ORIGIN`

The backend validates these variables at startup with a zod schema. If one is missing or malformed, the server exits before opening its port.

## Database Migration

When a migration exists, apply it before exposing the backend publicly:

```bash
cd server
npx prisma migrate deploy
```

For local schema work, continue using Prisma migrate dev.

The Docker compose stack expects the database to be ready before the backend starts. If you are using a fresh database, run the initial Prisma migration before sending traffic.

## Production Deployment Overview

1. Host the frontend as static assets.
2. Host the Express backend as a Node service.
3. Host PostgreSQL separately or through a managed database.
4. Set environment variables per environment.
5. Run Prisma migrations before switching traffic to a new schema.

## Frontend Hosting Notes

- Build the app with `npm run build`.
- Serve the generated `dist/` output from any static host or CDN.
- Set `VITE_API_URL` to the production API URL at build time.

## Backend Hosting Notes

- Build from `server/Dockerfile` or an equivalent Node runtime image.
- Ensure the backend has access to `DATABASE_URL`.
- Keep JWT secrets unique per environment.
- Set `CLIENT_ORIGIN` to the production frontend origin.
- The backend exposes `GET /api/health` and `GET /api/health/db` for readiness checks.
- The server handles `SIGINT` and `SIGTERM` by closing the HTTP listener and disconnecting Prisma cleanly.

## Database Hosting Notes

- Use PostgreSQL 16 or compatible.
- Keep backups enabled.
- Restrict access to the backend service and trusted operators only.
- Apply Prisma migrations in a controlled deployment step.
