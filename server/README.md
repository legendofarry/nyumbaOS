<!-- server\README.md -->
# Push Server

Standalone Web Push backend for the Apartment app.

## Setup

1. `cd server`
2. `npm install`
3. Create a `.env` file from `.env.example`
4. Fill in `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `PUSH_ADMIN_TOKEN`
5. Start the server with `npm start`

## Endpoints

- `GET /health`
- `GET /api/push/vapid-public-key`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `POST /api/push/notify`

## Example notify payload

```json
{
  "title": "New Payment Received",
  "body": "KSh 5,000 has been recorded.",
  "url": "/app/tenants/tenant-id",
  "userIds": ["tenant-id"]
}
```

Send `Authorization: Bearer <PUSH_ADMIN_TOKEN>` to `POST /api/push/notify` when the token is configured.
