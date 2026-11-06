# SyncShip

The shipping app, split out of sink-inventory. Merchants compare delivery partners, book riders, send customer checkout links, track orders, manage items, a storefront, a wallet and business settings.

Built with React 19 + Vite, TypeScript, Tailwind CSS v4, React Router 7, TanStack Query, Zustand, React Hook Form + Zod and Sonner (the same libraries sink-inventory uses, minus Next.js).

## Getting started

```bash
npm install
npm run dev        # http://localhost:5174
```

Other scripts: `npm run build`, `npm run preview`, `npm run type-check`, `npm run lint`.

## Environment

Copy `.env.example` to `.env.development` (already done) or `.env.production`.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base the browser calls. In dev keep `/api/v1/` so Vite proxies it (no CORS). In production use the full URL, e.g. `https://api.sync360.africa/api/v1/` — the backend must allow CORS from this app's domain. |
| `VITE_API_PROXY_TARGET` | Where the dev proxy forwards `/api/v1` (defaults to staging). |
| `VITE_AUTH_MODE` | `api` = real login/signup/OTP. `mock` = skip the backend and use a demo account. |

## What is real and what is sample data

- **Real API:** login (`auth/login/`), signup (`auth/signup/`), phone verification (`auth/verify-phone/`). Tokens are kept in localStorage and sent as `Authorization: Bearer`. A 401 signs the user out.
- **Sample data:** shipments, delivery rates, items, wallet, settings and employees. They live in `src/api/mock-data.ts` and are served through the hooks in `src/api/*.ts`. To connect a real endpoint, replace the service function in that file with an `apiRequest(...)` call — components don't change.

## Project structure

```
src/
  api/            data hooks + services (one file per domain), types, sample data
  components/
    ui/           design-system pieces from the design (Button, Field, Modal, Icon…)
    layout/       sidebar, header, mobile nav, app shell
  features/       one folder per area: auth, dashboard, shipments, items,
                  storefront, wallet, settings, onboarding
  lib/            api client, query client, formatting, cn()
  routes/         router, route paths, auth guards
  stores/         zustand stores (auth session, UI flags)
```

## Routes

`/login`, `/signup` (+ `/verify`, `/business`, `/kyc`), `/` overview, `/items`, `/shipments`, `/shipments/tracking`, `/shipments/new`, `/wallet` (+ `/fund`, `/withdraw`), `/settings/:section`, `/storefront`.
