# U4B Dashboard — Uber for Business

A real-time call analytics dashboard for Uber for Business outbound calling campaigns. Receives call data via webhook and stores it in a PostgreSQL database (Railway-hosted).

## Features

- **Webhook ingestion**: Receives call results and stores them in PostgreSQL
- **Analyze tab**: KPI cards (total calls, leads, qualified rate, meetings, avg duration) + charts
- **Monitor tab**: Leads table grouped by phone, expandable call history, filters
- **Auto-refresh**: Live data updates every 10 seconds
- **Date filtering**: Filter by week, time period, or all-time
- **Optional password protection**

## Webhook Payload

Send a `POST` request to `/api/webhook` with a JSON body:

```json
{
  "phone": "+34618953592",
  "name": "Juan Leal",
  "company": "Aliaga SA",
  "status": "Voicemail",
  "qualified": "false",
  "meeting": "",
  "summary": "Called but went to voicemail.",
  "attempt": "1",
  "duration": "0"
}
```

**Status values:** `Meeting scheduled`, `Callback requested`, `Send information`, `No interest`, `Not a fit`, `Wrong contact`, `Voicemail`, `Hang up`

**Field notes:**
- `qualified`: string `"true"` or `"false"` (auto-coerced to boolean)
- `attempt`: string number (auto-coerced to integer)
- `duration`: string number in seconds (auto-coerced to integer)
- `meeting`: ISO date string or empty string (empty → null)

## Environment Variables

Copy `env.sample` to `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Railway auto-provides) |
| `DASHBOARD_PASSWORD` | No | Password to protect the dashboard |
| `RUNS_START_DATE` | No | ISO date to filter data from (e.g. `2026-01-01`) |
| `WEBHOOK_SECRET` | No | Bearer token for webhook authentication |

## Local Development

### With Docker Compose (includes local Postgres)

```bash
cp env.sample .env
# Edit .env with your values

docker compose up
```

Dashboard available at http://localhost:3002

### Without Docker

```bash
# Requires a running PostgreSQL instance
cp env.sample .env.local
# Set DATABASE_URL in .env.local

npm install
npm run dev
```

Dashboard available at http://localhost:3000

## Railway Deployment

1. Create a new Railway project
2. Add a **PostgreSQL** plugin — `DATABASE_URL` is injected automatically
3. Deploy the repo (Railway detects Next.js automatically)
4. Set environment variables in Railway dashboard:
   - `DASHBOARD_PASSWORD` (optional)
   - `WEBHOOK_SECRET` (optional)
   - `RUNS_START_DATE` (optional)

The database schema is auto-created on first startup.

## Docker

```bash
# Build
docker build -t u4b-dashboard .

# Run
docker run -d -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e DASHBOARD_PASSWORD=secret \
  --name u4b-dashboard u4b-dashboard
```

## Testing the Webhook

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+34618953592",
    "name": "Juan Leal",
    "company": "Aliaga SA",
    "status": "Voicemail",
    "qualified": "false",
    "meeting": "",
    "summary": "Called but went to voicemail.",
    "attempt": "1",
    "duration": "45"
  }'
```

With webhook secret:

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-here" \
  -d '{ ... }'
```
