---
title: Mobile Shared Modules & Code Changes
date: 2026-03-10
---

## 1. Workspace & Package Layout
1. Convert repo to **Yarn workspaces** (or npm workspaces) with three top-level packages:
   - `web` (existing React app)
   - `mobile-app` (React Native)
   - `packages/shared`
2. Inside `packages/shared`, expose subfolders so both apps can import via `@shared/...`:
   - `api` – API client, endpoints, hooks
   - `types` – TypeScript interfaces, enums
   - `ui` – cross-platform primitives (pure logic + style tokens)
   - `utils` – formatting, validators, feature flags
3. Update `tsconfig.json`/`jsconfig.json` paths in both apps to map `@shared/*` to `../packages/shared/*`.

## 2. API Client & Networking
- **Source:** `src/services/apiClient.js`, `src/utils/apiConfig.js`.
- **Action:** move Axios instance + token refresh helpers into `packages/shared/api/client.ts`.
- Export hooks: `useApiClient`, `useAuthenticatedQuery`, `useMutationWithToast` that wrap React Query for consistent usage in both apps.
- Replace direct imports inside web (`src/pages/**`, `src/contexts/**`) with `@shared/api` to guarantee parity.
- Add environment resolver that looks at `process.env.API_BASE_URL` (web) and `Constants.expoConfig.extra.apiBaseUrl` (mobile) but shares normalization logic.

## 3. Domain Hooks & Services
For each major feature, create shared services (network + transformers). Initial targets:
1. **Auth** (`src/context/AuthContext.js`, `src/services/authService.js`): unify login, refresh, logout, profile fetching. Provide shared helpers for SecureStore vs. localStorage adapters.
2. **Escrow** (`src/contexts/EscrowContext.js`, `src/pages/EscrowTransaction.js`): replace mock/localStorage logic with API-backed queries/mutations located in `packages/shared/api/escrow.ts`.
3. **Disputes & Support** (`src/components/AdminDisputesManagement.js`, `src/pages/AdminSupportTickets.js`): move list/update calls into shared hooks so mobile admin can reuse.
4. **Properties & Investments** (`src/contexts/PropertyContext.js`, `src/pages/Investment*.js`): centralize property fetchers, filtering helpers, and investment creation endpoints.

Each shared service should export:
- Type definitions (request/response payloads)
- Pure formatter utilities (e.g., `formatEscrowStatus`)
- React Query hooks (web + mobile share behavior, only UI differs)

## 4. Design Tokens & UI Primitives
- Extract color palette, typography, spacing, shadow scale from Tailwind/theme files (e.g., `tailwind.config.js`) into `packages/shared/ui/tokens.ts`.
- Provide utilities to translate tokens into:
  - Web: CSS variables / Tailwind config extension.
  - Mobile: JS object consumed by Restyle/Styled Components theme provider.
- Define cross-platform typography + spacing helpers to keep visual consistency (e.g., `heading('lg')`).

## 5. Validation & Forms
- Gather validation schemas (search for Yup/Zod usage in `src/forms`, `src/pages/**`).
- Store reusable schemas in `packages/shared/utils/validation.ts` (prefer Zod to run in both environments).
- Ensure form field metadata (labels, placeholders) are exported so mobile forms can auto-generate steps when possible.

## 6. Feature Parity Checklist (Web → Mobile)
| Feature | Web Source | Shared Work | Mobile Notes |
| --- | --- | --- | --- |
| Auth/login | `src/pages/Login.js`, `src/services/authService.js` | Move credential flow + role switching into shared hook. | Mobile screens consume same hook; add biometric toggle later. |
| Property browsing | `src/pages/PropertyList.js`, `src/components/PropertyCard.js` | Share query + filtering logic; abstract card data props. | Build RN cards using same data contract. |
| Investments/Escrow creation | `src/pages/Investment.js`, `src/pages/InvestmentDetail.js` | Replace localStorage state machine with backend service + shared status constants. | Mobile flows follow same create→track pipeline. |
| Admin panels (escrow, disputes, support) | `src/pages/AdminDashboard.js` | Export actions (update status, resolve disputes, respond tickets) as shared mutations. | Mobile admin dashboard reuses logic, new RN UI only. |
| Notifications | `src/components/Notifications/*.js` | Share fetch/mark-as-read logic; emit typed notification payloads. | Mobile ties into push + in-app list. |

## 7. Implementation Order
1. **Set up workspaces + shared package scaffolding.**
2. **Migrate apiClient + auth helpers** (ensures both apps talk to backend identically).
3. **Escrow/Investment shared services** (highest parity gap due to mock data).
4. **Properties + notifications** (read-heavy, good candidates for offline caching).
5. **Admin feature services** for dispute/support actions.
6. **Design tokens + theming** once core services are reusable.

## 8. Supporting Tooling Changes
- Add lint rule (ESLint path group) enforcing imports from `@shared` instead of relative copies.
- Configure Jest aliases in both apps for shared modules.
- Update CI workflows to install dependencies at root (workspaces) and run tests for both packages.

## 9. Deliverables Checklist
- [ ] `packages/shared` initialized with tsconfig + build step (tsup or swc) for consumption.
- [ ] Shared apiClient exporting typed endpoints.
- [ ] Auth + Escrow services migrated and web references updated.
- [ ] Design tokens documented and consumed by both apps.
- [ ] Feature parity tracker kept in `docs/mobile_parity_status.md` (one row per user journey).

This outline keeps feature logic centralized, guarantees consistent backend usage, and leaves only platform-specific UI to be implemented in the mobile app.
