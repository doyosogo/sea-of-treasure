# Sea of Treasure

![Build](https://img.shields.io/badge/build-GitHub%20Actions-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-22%20LTS-339933)

Sea of Treasure is a browser-based pirate idle RPG inspired by naval battle games and idle progression systems.

It is built as a React and Vite frontend with localStorage persistence, level 50 progression, offline progression, combat, skills, crew, crafting, trading, quests, achievements, regions, bosses, world events, and a full save-management workflow.

## Feature Overview

- Naval combat with active, idle, and offline progression
- Level 50 ship progression with six world regions
- Cannon ammunition, selected ammo, and cannon loadout management
- Crew, skills, and talent trees
- Trading, cargo, materials, and crafting systems
- Treasure hunting and rare rewards
- Daily and weekly quests, achievements, bosses, and world events
- Save export, import, reset, and developer balance tools

## Technology Stack

- React
- Vite
- JavaScript
- Plain CSS
- localStorage persistence

## Current Status

This repository currently contains a frontend-first playable slice with a backend scaffold for authentication, cloud saves, health checks, and deployment hardening.

The game is still playable end to end in the browser without a backend. Progress is stored locally in the browser via `localStorage`. See [docs/frontend-status.md](docs/frontend-status.md) for the current frontend readiness summary.

### Planned backend work

- Authentication and account registration
- Cloud save sync
- User profiles
- Deployment and backend hardening

## Project Structure

```text
SeaOfTreasure/
├─ src/                  # Frontend app, pages, hooks, styles, data
├─ public/               # Static assets and scene artwork
├─ server/               # Express, Prisma, auth, save API, tests
├─ docs/                 # API, deployment, testing, and status docs
├─ .github/              # CI, issue templates, PR template, Dependabot
└─ README.md             # Project overview and setup
```

## Backend Architecture

```text
React/Vite frontend
  -> Auth context and save sync
  -> VITE_API_URL
Express API
  -> /api/auth/*
  -> /api/save
  -> /api/health
  -> Prisma client
  -> PostgreSQL
```

## Documentation

- [API docs](docs/api.md)
- [Deployment docs](docs/deployment.md)
- [Backend testing docs](docs/backend-local-testing.md)
- [Frontend status](docs/frontend-status.md)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Backend Setup

The backend scaffold lives in `server/` and is not connected to the frontend yet.

```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

The initial API includes authentication routes, cloud save routes, and `GET /api/health`.

Cloud save API endpoints are scaffolded under authenticated routes:

- `GET /api/save`
- `PUT /api/save`

To add the local database table for cloud saves:

```bash
cd server
npx prisma migrate dev --name add_save_game
```

## Deployment

See [docs/deployment.md](docs/deployment.md) for Docker setup, environment variables, migration steps, and hosting notes for the frontend, backend, and database.

## Testing

Backend tests live under `server/tests/` and use Node's built-in test runner.

```bash
cd server
npm test
```

Other useful commands:

- `npm run test:watch`
- `npm run test:coverage`

The tests cover auth validation, save API behavior, and health endpoints. Database-dependent checks are mocked or skipped so the suite can run without a live database.

## CI

GitHub Actions runs frontend builds and backend tests on every push and pull request.

- Frontend: `npm run build`
- Backend: `cd server && npm ci && npm run prisma:generate && npm test`

## Gameplay Systems

- Dashboard overview
- Battle system with bosses, regions, world events, idle combat, and offline rewards
- Shipyard and ship inspection
- Crew academy, skills, and talents
- Harbour trading and cargo management
- Shop, ammo restocking, cannon loadouts, and ship improvements
- Treasure vault and rare finds
- Achievements and milestones
- Daily and weekly quests
- Level 50 progression across six regions
- Save management and developer tools

## Screenshots

Placeholder section for future screenshots and gameplay captures.

## Roadmap

- Backend authentication
- Cloud save support
- Profile system
- Backend deployment
- Expanded regions and enemies
- Additional ship and cannon progression
- More world events and endgame content

## Author

Godoy Signature
