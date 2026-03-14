# Spring Boot App Runbook (IDE)

Use this when running backend with IDE `Spring Boot App` configuration.

## Required run configuration

- Main class: `org.myweb.uniplace.Application`
- Active profile: optional (`default` is fine for local)
- Environment variables:
  - `SERVER_PORT=8080`
  - `SERVER_SERVLET_CONTEXT_PATH=/api`
  - `APP_CORS_ALLOWED_ORIGINS=http://localhost:3000`

## Frontend .env (recommended)

- `FRONTEND_PROXY_TARGET=http://localhost:8080`
- `REACT_APP_BACKEND_BASE_URL=/api`

## Required IDE settings

- Enable automatic build.
- Add `Build` before launch in run configuration.
- If route behavior looks stale, run a full clean/rebuild and restart.

## Quick smoke checks

```powershell
curl.exe -i "http://localhost:8080/api/auth/check-nickname?nickname=test"
curl.exe -i "http://localhost:3000/api/auth/check-nickname?nickname=test"
curl.exe -i "http://localhost:3000/api/rooms"
```

Expected:

- No Tomcat `404` HTML for valid API paths.
- `check-nickname` should return JSON `200`.
- `rooms` should return JSON `200`.
