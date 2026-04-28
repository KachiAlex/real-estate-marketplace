# Capacitor Routing Decision

## Decision
Keep `BrowserRouter` for the Capacitor app for now.

## Why
- The current app already uses client-side routing throughout `src/App.js`.
- Capacitor loads the built SPA inside a WebView, so internal navigation works with `BrowserRouter`.
- Switching to `HashRouter` would change URL behavior and is not necessary for the first Capacitor build.

## When BrowserRouter is enough
Use `BrowserRouter` if:
- the app is loaded from the local Capacitor WebView shell
- navigation happens inside the app
- you do not rely on external deep links into every route

## When to revisit routing
Consider `HashRouter` or explicit deep-link handling only if:
- you need app links opened from outside the app to route directly to nested pages
- Android/iOS deep link handling becomes a requirement
- the native shell fails to preserve SPA navigation history

## Current repo status
- `src/index.js` uses `BrowserRouter`
- `src/App.js` defines the full route tree with React Router
- The app already uses SPA-style routes, so the first Capacitor build should work without a router rewrite

## Recommendation for the first migration pass
1. Keep `BrowserRouter`
2. Build the web app
3. Sync with Capacitor
4. Test internal navigation on Android
5. Only change routing if a real deep-link problem appears

## Native deep-link note
If you later need external links to open specific screens inside the app, add Capacitor deep-link handling instead of rewriting the router immediately.
