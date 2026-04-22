# @real-estate-marketplace/shared

Shared TypeScript utilities consumed by the React web app and React Native mobile app. This package will house the API client, domain services, validation schemas, design tokens, and any other logic that should stay synchronized across platforms.

## Structure
```
packages/shared/
  src/
    api/
    types/
    ui/
    utils/
    index.ts
```

## Scripts
- `npm run build` – bundles the shared code via `tsup` into `dist/` with both ESM and CJS outputs.
- `npm run clean` – removes the build artifacts.

## Usage
After running `npm install` from the repo root (with workspaces enabled), import shared modules via the alias you configure (e.g., `@shared/api`). The plan is to keep all cross-platform logic here so each app only focuses on UI.
