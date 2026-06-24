# Backend Architecture Plan

## Backend Goals

Sea of Treasure is currently a frontend-first pirate idle RPG with localStorage saves. The next phase is a backend that supports persistent accounts, cloud save synchronization, and a foundation for future profile features.

The backend should:

- Preserve the current single-player gameplay loop
- Move player saves from browser storage to authenticated cloud storage
- Provide a clean API for future frontend and backend expansion
- Keep localStorage import/export as a fallback path

## Recommended Stack

- Backend: Node.js, Express
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT access token, refresh token, bcrypt password hashing
- Validation: Zod
- Deployment: Docker later

## Authentication Approach

Use a standard token-based login flow:

- Users register with email and password
- Passwords are hashed with bcrypt before storage
- Login issues a short-lived JWT access token
- Refresh tokens are used to obtain new access tokens
- Logout invalidates the refresh token

This keeps the frontend simple and allows future expansion into profiles, leaderboard services, and account settings.

## Database Schema Overview

### User

- id
- email
- passwordHash
- createdAt
- updatedAt

### UserProfile

- id
- userId
- displayName
- avatarUrl
- region
- bio
- createdAt
- updatedAt

### SaveGame

- id
- userId
- saveVersion
- saveData
- checksum
- createdAt
- updatedAt
- lastSyncedAt

### AchievementSnapshot

- id
- userId
- saveGameId
- achievementId
- claimedAt

### QuestSnapshot

- id
- userId
- saveGameId
- questId
- progress
- claimed
- resetAt

The save payload can remain JSON-based at first, with structured columns added later if needed.

## Save Game Sync Strategy

The sync model should be conservative.

1. On login, detect whether the browser has a local save.
2. If a local save exists, ask the user whether they want to upload it to cloud storage.
3. Never overwrite a cloud save silently.
4. Keep export and import as fallback tools.
5. Use versioning and checksums to detect mismatched or corrupted payloads.

Recommended flow:

- Local save present, cloud save absent: offer upload
- Local save present, cloud save present: let the user choose which save to keep or merge manually later
- Cloud save present, local save absent: load cloud save

## API Route Plan

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

### Save

- `GET /api/save`
- `PUT /api/save`

### Profile

- `GET /api/profile`
- `PUT /api/profile`

### Health

- `GET /api/health`

## Security Considerations

- Hash passwords with bcrypt
- Use JWT access tokens with short expiry
- Store refresh tokens securely and invalidate them on logout
- Validate all request payloads with Zod
- Rate-limit auth routes
- Restrict save access to the authenticated user only
- Treat save JSON as untrusted input
- Log server errors without exposing secrets or stack traces to clients

## Deployment Plan

The initial target should be a simple Node server with PostgreSQL.

Later:

- Containerize the backend with Docker
- Add environment-based configuration
- Separate app server and database concerns cleanly
- Prepare for managed deployment or VPS hosting

## Migration Strategy From localStorage

The browser save remains the starting point for current players.

Recommended migration path:

1. User logs in on the new backend.
2. The frontend checks for a local save.
3. The user chooses whether to upload the local save to the cloud.
4. The backend stores the uploaded save as the first cloud save.
5. Future sessions load from cloud after authentication.

Rules:

- Never silently replace cloud progress
- Never delete a local save automatically
- Keep export/import available as a recovery path

## Development Phases

### Phase 1 Backend Scope

Only:

- register
- login
- authenticated cloud save
- load save
- update save
- health check

No:

- payments
- premium subscriptions
- multiplayer
- leaderboards
- clans

### Phase 2

- User profiles
- Save history
- Better migration tooling

### Phase 3

- Leaderboards
- Social features
- Guilds and clans

### Phase 4

- Containerized deployment
- Observability
- Admin tools
