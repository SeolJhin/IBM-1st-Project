# Frontend S3 Migration Checklist

## Goal
- Frontend static files on S3 bucket #1 (+ CloudFront)
- User/admin uploaded files on S3 bucket #2 (+ CloudFront) keep current flow
- Backend/API remains on EKS (`/api/*`)

## Before Cutover
- Fix frontend build errors and run:
  - `npm run build`
  - `npm run lint`
- Verify backend file URL base is file CloudFront domain, not S3 origin.
- Confirm frontend CloudFront distribution has:
  - Default origin = frontend S3 bucket
  - Behavior `/api/*` = EKS ALB origin
  - Cache policy for `/api/*` disabled
  - SPA fallback: 403/404 -> `/index.html` (HTTP 200)
- Confirm CORS/allowed origins in backend include both:
  - `https://uniplace.site`
  - `https://www.uniplace.site`

## Deployment
1. Build and upload frontend:
   - `powershell -ExecutionPolicy Bypass -File uni-place-frontend/scripts/deploy-static-to-s3.ps1 -BucketName <bucket> -DistributionId <distribution-id> -Region ap-northeast-2`
2. Verify CloudFront invalidation completed.
3. If using Route53 weighted cutover, start with small weight.

## Smoke Test
- Public pages load with hard refresh.
- Login, token refresh, logout.
- Admin image upload/list/delete.
- Contract PDF/image view.
- Core `/api/*` calls from browser network tab return expected status.

## Rollback
- Repoint DNS to previous frontend endpoint (or set CloudFront weight to 0).
- Keep backend and file CloudFront unchanged.
- Invalidate frontend CloudFront (`/`, `/index.html`) after rollback.
