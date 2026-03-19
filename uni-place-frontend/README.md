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

App URL: `http://dev-host:3000`

## Build (production)

```bash
npm run build
```

Build output: `dist/`

## Deploy To S3 + CloudFront

1. Build and deploy:

```bash
powershell -ExecutionPolicy Bypass -File scripts/deploy-static-to-s3.ps1 `
  -BucketName <frontend-bucket-name> `
  -DistributionId <cloudfront-distribution-id> `
  -Region ap-northeast-2
```

2. Dry-run (no upload/invalidation):

```bash
powershell -ExecutionPolicy Bypass -File scripts/deploy-static-to-s3.ps1 `
  -BucketName <frontend-bucket-name> `
  -DistributionId <cloudfront-distribution-id> `
  -Region ap-northeast-2 `
  -DryRun
```

Recommended CloudFront behavior:
- Default behavior: S3 frontend bucket origin.
- Additional behavior: `/api/*` -> existing EKS ALB origin (disable caching).
- Error response for SPA routes: map 403/404 to `/index.html` with HTTP 200.

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
- Default: `/api -> http://dev-host:8080`
- Override with `.env`:
  - `FRONTEND_PROXY_TARGET=http://dev-host:8080`
  - `VITE_BACKEND_BASE_URL=/api`
