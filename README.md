# Sea of Treasure

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

This repository currently contains a frontend-only, local-save vertical slice.

The game is playable end to end in the browser without a backend. Progress is stored locally in the browser via `localStorage`. See [docs/frontend-status.md](docs/frontend-status.md) for the current frontend readiness summary.

### Planned backend work

- Authentication and account registration
- Cloud save sync
- User profiles
- Deployment and backend hardening

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

The initial API includes authentication route scaffolding and `GET /api/health`.

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
