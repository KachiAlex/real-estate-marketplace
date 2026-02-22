# Frontend smoke test

This script performs a quick check of the deployed frontend and the backend API:

- Confirms the frontend root URL is reachable (HTTP 200)
- Calls backend `/api/health`
- Logs in with admin credentials (`/api/auth/login`) to obtain a token
- Calls `/api/admin/vendors/pending` using the token and prints the response

Prerequisites:
- Node.js 18+ (script uses global `fetch`)

Usage:
```sh
node tools/frontend-smoke/runSmoke.js \
  https://your-frontend-url.example.com \
  https://your-backend.example.com \
  smoke.admin.test@propertyark.com \
  AdminPass123!
```

Example (for your deployment):
```sh
node tools/frontend-smoke/runSmoke.js \
  https://real-estate-marketplace.vercel.app \
  https://real-estate-marketplace-1-k8jp.onrender.com \
  smoke.admin.test@propertyark.com \
  AdminPass123!
```

Exit codes:
- `0` — all checks passed
- non-zero — some check failed (check stderr for details)
