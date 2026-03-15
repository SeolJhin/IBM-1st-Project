# Uni Place Frontend (Vite)

## Source Tree Rule

- Edit only `uni-place-frontend/src`.
- Do not re-create duplicate source folders like `src/src` or `src2222222222222`.
- `npm start`, `npm run build`, and `npm test` run a source-tree check first.

## Prerequisites

- Node `24.x` (project is pinned via Volta in `package.json`)
- npm

## Install

```bash
npm ci
```

## Run (development)

```bash
npm run dev
```

App URL: `http://localhost:3000`

## Build (production)

```bash
npm run build
```

Build output: `dist/`

## Test

```bash
npm test
```

## Lint

```bash
npm run lint
```

## API Proxy (local)

- Proxy config is in `vite.config.js`
- Default: `/api -> http://localhost:8080`
- Override with `.env`:
  - `FRONTEND_PROXY_TARGET=http://localhost:8080`
  - `VITE_BACKEND_BASE_URL=/api`
