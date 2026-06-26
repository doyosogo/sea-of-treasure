# Backend Local Testing

These examples assume the API is running at `http://localhost:4000`.

## Setup

```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Set long random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env` before testing auth.

After adding the cloud save model, create the local database migration with:

```bash
cd server
npx prisma migrate dev --name add_save_game
```

## Health Check

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{"status":"ok","service":"sea-of-treasure-api"}
```

## Register

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"captain@example.com","username":"captain","password":"password123"}'
```

The response includes `user`, `accessToken`, and `refreshToken`. The `user` object does not include `passwordHash`.

## Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"captain@example.com","password":"password123"}'
```

Save the returned tokens for the next requests:

```bash
ACCESS_TOKEN="paste-access-token"
REFRESH_TOKEN="paste-refresh-token"
```

## Current User

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Save Cloud Progress

The cloud save endpoints require a valid access token. This does not change or remove browser `localStorage` saves.

```bash
curl -X PUT http://localhost:4000/api/save \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"version":"1.0","data":{"playerLevel":1,"gold":0,"ownedShips":[1]}}'
```

The response returns the saved data, version, and `updatedAt`.

## Load Cloud Progress

```bash
curl http://localhost:4000/api/save \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

If no cloud save exists yet, the response is:

```json
{"save":null}
```

## Refresh

Refresh rotates the refresh token. Replace your local token variables with the returned values.

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

## Logout

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

Expected response:

```json
{"success":true}
```

## Common Error Responses

- Validation errors return `400` with JSON details.
- Duplicate email or username returns `409`.
- Invalid login returns `401`.
- Missing or invalid access token returns `401`.
- Save payloads larger than 2MB return `413`.
