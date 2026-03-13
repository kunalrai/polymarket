# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install root dependencies (Convex + auth)
npm install

# Install frontend dependencies
cd frontend && npm install

# Run Convex backend (deploys TypeScript functions, watches for changes)
npm run dev
# or: npx convex dev

# Run frontend dev server
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build
```

## Environment Variables

**Root `.env` (for Convex deployment):**
```
ADMIN_EMAIL=your-admin@example.com
```

**`frontend/.env.local` (for Vite):**
```
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
```

Set `ADMIN_EMAIL` as a Convex environment variable via the Convex dashboard or `npx convex env set ADMIN_EMAIL your@email.com`.

## Architecture

**Single-tier backend — no Flask:**
- **Convex** (`convex/`) — all data storage, business logic, and authentication. Uses `@convex-dev/auth` with the Password provider.
- **React** (`frontend/src/`) — uses `useQuery`/`useMutation`/`useAction` from `convex/react` directly, and `useAuthActions`/`useConvexAuth` from `@convex-dev/auth/react`.

**Convex data model** (`convex/schema.ts`):
- `authTables` — spread from `@convex-dev/auth/server`; manages users and sessions automatically
- `markets` — prediction market (timestamps stored as unix ms)
- `trades` — buy transactions; creating a trade also updates `holdings` and `market.volume`
- `holdings` — aggregated shares per user per market
- `market_prices` — price history
- `market_resolution_logs` — admin audit trail

**Convex functions:**
- `convex/auth.ts` — exports `{ auth, signIn, signOut, store }` from `convexAuth`
- `convex/http.ts` — HTTP router with auth routes attached
- `convex/users.ts` — `currentUser` (public query), `getById` (internal query)
- `convex/markets.ts` — `getActive`, `getAll`, `getById`, `searchActive`, `getCategories`, `create` (mutation, admin-only), `createInternal` (internal mutation), `createBtcMarket` (action, admin-only)
- `convex/trades.ts` — `getByMarket` (query), `create` (mutation, auth required)

**Authentication:**
- Uses `@convex-dev/auth` Password provider.
- `signIn('password', { email, password, flow: 'signIn' })` for login.
- `signIn('password', { email, password, flow: 'signUp' })` for registration.
- `signIn('password', { email, flow: 'reset' })` to request password reset code.
- `signIn('password', { email, code, newPassword, flow: 'reset-verification' })` to confirm reset.
- Admin check: `user.email === process.env.ADMIN_EMAIL` in Convex functions.

**Frontend structure** (`frontend/src/`):
- `main.jsx` — wraps app in `<ConvexAuthProvider>`
- `App.jsx` — router with `AdminRoute` guard using `useConvexAuth` + `useQuery(api.users.currentUser)`
- `components/Navbar.jsx` — uses `useConvexAuth`, `useQuery(api.users.currentUser)`, `useAuthActions`
- `components/MarketCard.jsx` — displays market card; handles `end_date` as unix ms timestamp
- `pages/` — all pages use Convex hooks directly, no intermediate API layer

**Import paths for `api`:**
- From `frontend/src/App.jsx`: `'../../convex/_generated/api'`
- From `frontend/src/pages/*.jsx`: `'../../../convex/_generated/api'`
- From `frontend/src/components/*.jsx`: `'../../../convex/_generated/api'`

## Deployment

Convex functions deploy via `npx convex deploy`. The frontend builds to `frontend/dist/` and can be served as a static site. Set `VITE_CONVEX_URL` to your production Convex deployment URL.
