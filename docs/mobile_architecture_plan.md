---
title: Mobile Architecture Plan
date: 2026-03-10
---

## 1. Goals & Constraints
- Deliver full feature parity with the existing web app on iOS and Android.
- Reuse the current REST backend without introducing mobile-specific gateways.
- Support offline read capability for critical screens and prepare hooks for push notifications.
- Maintain rapid iteration speed for the mobile team by sharing business logic, validation, and API utilities with the web codebase.

## 2. Recommended Stack Overview
| Layer | Recommendation | Notes |
| --- | --- | --- |
| Mobile framework | **React Native (Expo managed workflow initially)** | Expo accelerates setup, OTA updates, and provides push tooling; we can eject later if heavy native modules are required. |
| Language | TypeScript | Matches the existing frontend stack and enables shared types/interfaces. |
| Navigation | React Navigation (stack + tab navigators) | Mature, deep linking support, works well with Expo. |
| State/data fetching | React Query + Context/Zustand for global app state | React Query already meshes with REST APIs and offline caching plans. |
| Forms | React Hook Form | Same validation patterns as web, easy schema sharing via Zod/Yup. |
| Styling | Restyle or Styled Components + design tokens | Encourages theme reuse; tokens can map to existing Tailwind/CSS variables. |
| Notifications | Expo Notifications -> FCM/APNs | Device tokens will be registered via new backend endpoint. |

## 3. High-Level Architecture
1. **App Shell** – Handles navigation containers, splash, theme provider, auth gate.
2. **Feature Modules** – Encapsulate screens + hooks per domain (Properties, Escrow, Investments, Support, Admin if required). Each module exports:
   - Screen components
   - Domain-specific hooks (e.g., `useEscrowTransactions`)
   - UI fragments (cards, lists) that can be shared.
3. **Shared Layer** – Lives in a cross-platform package (e.g., `packages/shared` or `/src/shared`). Includes:
   - `apiClient` wrapper reusing the existing Axios configuration, with React Native storage for tokens.
   - Validation schemas, type definitions, constants (status enums, routes, copy).
   - Utility hooks: auth, tracking, formatting, feature flags.
4. **Platform Services** – Thin wrappers for native capabilities (push notifications, secure storage, file uploads, camera). Abstract these to keep most code platform-agnostic.

## 4. Authentication Flow (using existing backend APIs)
1. **Sign-in** hits `/api/auth/login` (same as web) and stores `accessToken` + `refreshToken` in secure storage (e.g., Expo SecureStore).
2. `apiClient` interceptors attach the bearer token; 401 responses trigger refresh via `/api/auth/refresh`.
3. React Query persist layer hydrates queries post-login for offline support.
4. Device token registration: after login and on token refresh, POST to `/api/notifications/device-tokens` (new endpoint) with `{ userId, deviceToken, platform }` so backend can send pushes.

## 5. Offline & Caching Strategy
- Use React Query’s `persistQueryClient` with `@react-native-async-storage/async-storage` or MMKV for better performance.
- Define cache policies per domain (e.g., Properties list = stale after 5 min, Escrow transactions = 60 sec).
- Provide an "Offline ready" checklist per screen: 
  1. Query hooked into persistence
  2. Optimistic mutation strategy (e.g., support ticket updates)
  3. User feedback banners for offline mode

## 6. Push Notification Plan
1. Expo Push service for MVP (maps to APNs/FCM). For production scale, we can migrate to direct FCM/APNs once infra is ready.
2. Backend requirements:
   - Store device tokens per user with metadata (platform, last seen, notification preferences).
   - Extend existing notification system (see `/notifications` routes) to broadcast through Expo Push.
   - Add CRON/queue workers for transactional pushes (escrow updates, support ticket responses, dispute actions).

## 7. Shared Assets & Design System
- Export color palette, typography scale, spacing, and iconography from the web app into a `design-tokens.json`. Use Style Dictionary (optional) to emit Tailwind config + React Native theme.
- Reuse SVGs/icons through `react-native-svg` conversions. Maintain an `icons/` folder with platform-friendly variants.
- Document responsive patterns (card layouts, tables -> accordions) so each feature module has a clear mobile adaptation guide.

## 8. Development & Tooling
- **Directory proposal**: 
  - `mobile-app/` (React Native app)
  - `packages/shared/` (TS shared code) consumed by both `web` and `mobile` via Yarn workspaces or npm link.
- **Environment handling**: mirror `.env` variables; expose `API_BASE_URL` through Expo config. Use the same staging/prod endpoints as web.
- **Testing**: Jest + React Native Testing Library for unit/UI tests; Detox or Maestro for E2E smoke flows (login, browse, escrow action).
- **CI/CD**: Expo EAS build pipelines producing `.apk/.aab/.ipa`. Hook into existing GitHub Actions or Render pipeline for continuous delivery.

## 9. Immediate Action Items
1. **Set up workspace** with Yarn workspaces so shared modules can be imported by both web and mobile.
2. **Extract shared utilities** (API client, validation schemas, status enums) into the shared package.
3. **Harden backend auth** for mobile (confirm refresh tokens, CORS origins, rate limits, device-token endpoint).
4. **Define MVP screen list** with parity checklist to sequence implementation.
5. **Document notification triggers** mapping backend events to push payloads.

This plan keeps the codebase cohesive, maximizes reuse, and lays the groundwork for auditing backend/auth layers next.
