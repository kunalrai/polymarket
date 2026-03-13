# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Python setup
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Convex setup (requires Node.js)
npx convex dev        # deploys TypeScript functions and starts watching for changes
# This prints your CONVEX_URL — add it to .env

# Development server (http://localhost:5000)
python app.py

# Production server
gunicorn --bind=0.0.0.0 --timeout 600 app:app
```

## Environment Variables

Requires a `.env` file:
```
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
SECRET_KEY=...
CONVEX_URL=https://<your-deployment>.convex.cloud
```

## Architecture

**Two-tier backend:**
- **Convex** (TypeScript, `convex/`) — all data storage and business logic. Defines tables in `schema.ts` and exposes named queries/mutations in `markets.ts`, `trades.ts`, `users.ts`.
- **Flask** (`app.py`) — HTTP layer / Jinja2 template rendering. Calls Convex via the Python `convex` client (`get_convex_client()` in `utils/convex_client.py`).

**Convex data model** (`convex/schema.ts`):
- `users` — email + bcrypt password hash
- `markets` — prediction market (timestamps stored as unix ms)
- `trades` — buy transactions; creating a trade also updates `holdings` and `market.volume`
- `holdings` — aggregated shares per user per market
- `market_prices` — price history
- `market_resolution_logs` — admin audit trail
- `password_reset_tokens` — short-lived tokens for password reset flow

**Authentication:**
- Admin: hardcoded `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, checked in `admin_required` decorator.
- Regular users: bcrypt-hashed password stored in Convex `users` table; validated on login.
- Password reset generates a token stored in Convex (expires 1 hour). Email delivery is not wired up — the reset URL is currently logged to the server console. Wire up Flask-Mail or similar to send it.

**Convex result conversion:** `_to_obj()` in `app.py` converts Convex dicts to `SimpleNamespace` objects (so templates use `market.title` not `market["title"]`). It also maps `_id` → `id` and converts millisecond timestamps to `datetime` objects.

## Deployment

Deployed to Azure Web Apps via GitHub Actions (`.github/workflows/deployment.yml`) on push to `main`. Convex functions are deployed separately via `npx convex deploy`. Add `CONVEX_URL` to GitHub Actions secrets.
