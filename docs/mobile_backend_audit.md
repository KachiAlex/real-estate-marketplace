---
title: Mobile Backend/Auth Audit
date: 2026-03-10
---

## 1. CORS & API Accessibility
- **Current behavior:** `backend/server.js` sets `Access-Control-Allow-Origin` dynamically, defaulting to any origin but only whitelisting logs for unknown origins. Credentials are enabled (`Allow-Credentials: true`).
- **Risk for mobile:** Mobile apps often use `fetch`/Axios without browser CORS restrictions, but we still need deterministic allowed origins for future webviews and ensure preflight logic won’t reject React Native packager (e.g., `exp://`, `http://10.0.2.2`).
- **Actions:**
  1. Add explicit allowances for local LAN/devices (e.g., `http://10.0.2.2:3000`, `http://192.168.0.0/16`).
  2. Document backend expectation that mobile clients send `Origin: null`; confirm middleware already permits missing origin (it does).
  3. Consider moving CORS config from custom middleware to a shared helper that can be reused by serverless endpoints (Azure Functions, etc.).

## 2. Authentication & Token Refresh
- `POST /api/auth/login` and `POST /api/auth/refresh` already issue access + refresh tokens with 24h/7d expiry (`backend/routes/authPostgres.js`).
- Access token payload contains `roles` and `activeRole`, matching web needs; refresh flow uses Sequelize lookup.
- **Mobile considerations:**
  - React Native must store tokens in **SecureStore/Keychain** (avoid AsyncStorage for refresh token).
  - Need a deterministic refresh failure response for silent logout (currently 401 + message – acceptable).
  - Consider returning `user` object on refresh as web does elsewhere to keep cache hydrated.
  - Rate-limit refresh endpoint to mitigate abuse, especially because mobile devices may retry frequently when offline.

## 3. Device Token / Push Support
- Current notifications system (`backend/routes/notifications.js`, `notificationService`) handles in-app notifications only; there’s **no device-token storage or push dispatch** yet.
- **Gap:** need REST endpoints + DB table to store `{ userId, deviceToken, platform, locale, lastActive }`.
- **Proposed additions:**
  1. `POST /api/notifications/device-tokens` (auth required) to upsert user device tokens.
  2. `DELETE /api/notifications/device-tokens/:token` to deregister.
  3. Extend notification service to fan out via Expo Push or FCM worker (can be a background job).

## 4. Rate Limiting & Security Headers
- No per-IP rate limiting is applied in `server.js`. Mobile apps will share the same API, so we should introduce middleware (e.g., `express-rate-limit`, `rate-limiter-flexible`).
- Security headers (Helmet) appear configured elsewhere; confirm they don’t block React Native user agents.

## 5. API Surface Review for Mobile Parity
- **Authentication:** Already REST-based, good to reuse.
- **Escrow / Disputes / Support:** Routes exist and are admin-protected; ensure role-based middleware works with mobile tokens (should, as JWT contains roles).
- **File uploads:** Need guidance for React Native (use pre-signed URLs or existing `/api/upload` endpoints?). Validate CORS/Content-Type acceptance for multipart requests from RN.

## 6. Backend Tasks to Enable Mobile
1. [ ] Add device-token model + migration, create REST endpoints, and integrate with notification service.
2. [ ] Extend CORS whitelist to cover emulator/device hosts; create configuration doc.
3. [ ] Introduce rate limiting for auth and write-up on mobile retry/backoff strategy.
4. [ ] Verify upload endpoints accept RN’s `fetch` behavior; if not, add presigned upload option.
5. [ ] Document auth flows (login, refresh, logout) for mobile team, including error codes.

This audit ensures the backend is ready for mobile clients while highlighting concrete follow-up tasks.
