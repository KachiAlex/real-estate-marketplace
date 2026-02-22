# Vercel frontend: environment variables and deployment checklist

Follow these steps so the Vercel-hosted frontend talks to your Render backend (production):

1. Add environment variables in Vercel (Project → Settings → Environment Variables)

- Key: `REACT_APP_API_URL`
  - Value: `https://real-estate-marketplace-1-k8jp.onrender.com` (replace with your backend URL)
  - Environment: `Production` (also add `Preview` if you want staging)

- Add any `REACT_APP_FIREBASE_*` keys your app requires (from Firebase console).

2. Do NOT add `DATABASE_URL` to client envs. Database credentials must live only on the backend.

3. Redeploy frontend on Vercel. Confirm in browser DevTools → Network that requests go to `REACT_APP_API_URL`.

4. Quick verification curl commands (run locally):
```
curl -sS $REACT_APP_API_URL/api/health
curl -sS $REACT_APP_API_URL/api/admin/vendors/pending -H "Authorization: Bearer <ADMIN_TOKEN>"
```

5. Optional: Add this env via Vercel CLI
```
# Requires `vercel` CLI and authentication
vercel env add REACT_APP_API_URL production
```

Security reminder: never expose `DATABASE_URL` or server secrets via client envs on Vercel. Backend holds DB credentials.
