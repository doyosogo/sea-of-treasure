# API Reference

Base URL examples below assume a local backend at `http://localhost:3001`.

## Authentication

### `POST /api/auth/register`

Purpose: create a new account and issue login tokens.

Authentication required: no.

Request body:

```json
{
  "email": "captain@example.com",
  "username": "captain",
  "password": "password123"
}
```

Successful response:

```json
{
  "user": {
    "id": "clx...",
    "email": "captain@example.com",
    "username": "captain",
    "createdAt": "2026-06-29T00:00:00.000Z",
    "updatedAt": "2026-06-29T00:00:00.000Z"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

Error responses:

- `400` Validation failed.
- `409` Email or username is already registered.
- `500` Internal server error.

Example request:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"captain@example.com","username":"captain","password":"password123"}'
```

Example response: see successful response above.

### `POST /api/auth/login`

Purpose: authenticate an existing account and issue tokens.

Authentication required: no.

Request body:

```json
{
  "email": "captain@example.com",
  "password": "password123"
}
```

Successful response:

```json
{
  "user": {
    "id": "clx...",
    "email": "captain@example.com",
    "username": "captain",
    "createdAt": "2026-06-29T00:00:00.000Z",
    "updatedAt": "2026-06-29T00:00:00.000Z"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

Error responses:

- `400` Validation failed.
- `401` Invalid email or password.
- `500` Internal server error.

Example request:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"captain@example.com","password":"password123"}'
```

Example response: see successful response above.

### `POST /api/auth/logout`

Purpose: revoke the submitted refresh token.

Authentication required: no, but a refresh token is required in the request body.

Request body:

```json
{
  "refreshToken": "eyJ..."
}
```

Successful response:

```json
{
  "success": true
}
```

Error responses:

- `400` Validation failed.
- `401` Invalid or expired token.
- `500` Internal server error.

Example request:

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJ..."}'
```

Example response: see successful response above.

### `POST /api/auth/refresh`

Purpose: exchange a refresh token for a new access token and refresh token.

Authentication required: no, but a refresh token is required in the request body.

Request body:

```json
{
  "refreshToken": "eyJ..."
}
```

Successful response:

```json
{
  "user": {
    "id": "clx...",
    "email": "captain@example.com",
    "username": "captain",
    "createdAt": "2026-06-29T00:00:00.000Z",
    "updatedAt": "2026-06-29T00:00:00.000Z"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

Error responses:

- `400` Validation failed.
- `401` Invalid refresh token.
- `500` Internal server error.

Example request:

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJ..."}'
```

Example response: see successful response above.

### `GET /api/auth/me`

Purpose: return the current authenticated user.

Authentication required: yes, `Authorization: Bearer <accessToken>`.

Request body: none.

Successful response:

```json
{
  "user": {
    "id": "clx...",
    "email": "captain@example.com",
    "username": "captain",
    "createdAt": "2026-06-29T00:00:00.000Z",
    "updatedAt": "2026-06-29T00:00:00.000Z"
  }
}
```

Error responses:

- `401` Missing bearer token.
- `401` Invalid or expired token.
- `500` Internal server error.

Example request:

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJ..."
```

Example response: see successful response above.

## Save

### `GET /api/save`

Purpose: fetch the authenticated user’s cloud save.

Authentication required: yes, `Authorization: Bearer <accessToken>`.

Request body: none.

Successful response when no save exists:

```json
{
  "save": null
}
```

Successful response when a save exists:

```json
{
  "save": {
    "data": {},
    "version": "1.0",
    "updatedAt": "2026-06-29T00:00:00.000Z"
  }
}
```

Error responses:

- `401` Missing bearer token.
- `401` Invalid or expired token.
- `500` Internal server error.

Example request:

```bash
curl http://localhost:3001/api/save \
  -H "Authorization: Bearer eyJ..."
```

Example response: see successful response above.

### `PUT /api/save`

Purpose: create or update the authenticated user’s cloud save.

Authentication required: yes, `Authorization: Bearer <accessToken>`.

Request body:

```json
{
  "data": {},
  "version": "1.0"
}
```

Successful response:

```json
{
  "save": {
    "data": {},
    "version": "1.0",
    "updatedAt": "2026-06-29T00:00:00.000Z"
  }
}
```

Error responses:

- `401` Missing bearer token.
- `401` Invalid or expired token.
- `400` Validation failed.
- `413` Save payload is too large.
- `500` Internal server error.

Example request:

```bash
curl -X PUT http://localhost:3001/api/save \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"data":{"playerLevel":12,"gold":3456},"version":"1.0"}'
```

Example response: see successful response above.

## Health

### `GET /api/health`

Purpose: basic service readiness check.

Authentication required: no.

Request body: none.

Successful response:

```json
{
  "status": "ok",
  "service": "sea-of-treasure-api",
  "environment": "production",
  "timestamp": "2026-06-29T00:00:00.000Z"
}
```

Error responses:

- `500` Internal server error.

Example request:

```bash
curl http://localhost:3001/api/health
```

Example response: see successful response above.

### `GET /api/health/db`

Purpose: check whether Prisma can connect to the configured database.

Authentication required: no.

Request body: none.

Successful response:

```json
{
  "status": "ok",
  "service": "sea-of-treasure-api",
  "database": "connected",
  "timestamp": "2026-06-29T00:00:00.000Z"
}
```

Error responses:

- `503` Database unavailable.
- `500` Internal server error.

Example request:

```bash
curl http://localhost:3001/api/health/db
```

Example response: see successful response above.
