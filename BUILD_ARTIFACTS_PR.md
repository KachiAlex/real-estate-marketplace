Title: Add build artifacts for CI verification

Branch: build-artifacts-509288b-1770582182.76557

Summary:
- This branch contains the production `build/` artifacts generated locally after fixing dependency and code issues that prevented CI/Netlify builds.
- Purpose: allow reviewers or CI to inspect the compiled output and verify that the fixes produce a successful build.

Notes for reviewers:
- I restored `src/contexts/PropertyContext.js` from a known-good commit to remove corrupted edits.
- Removed a corrupted `yarn.lock` so Netlify will use `npm`/`package-lock.json` instead of failing Yarn parse.
- Resolved `package.json` merge conflicts and ensured runtime deps like `react-helmet-async` are in `dependencies`.
- Fixed a duplicated/invalid `src/utils/HelmetShim.js` and other small issues to allow build to complete.
- Local build was run with increased Node memory (`NODE_OPTIONS=--max-old-space-size=8192`) and succeeded.

Suggested PR body:
```
This PR adds the generated `build/` artifacts for CI verification.

What I did:
- Restored and fixed several frontend files that caused build failures.
- Removed corrupted `yarn.lock` and resolved merge conflicts in `package.json`.
- Produced a local production build (see `build/` contents in this branch).

Why:
- Netlify builds were failing due to a corrupted lockfile and some runtime/dependency issues. Including the build artifacts allows quick verification that the fixes produce a valid production build before triggering a full CI deploy.

Next steps:
- Review changes and, if acceptable, merge to `main` or use these artifacts to validate deployment on Netlify.
```

Open PR URL:
https://github.com/KachiAlex/real-estate-marketplace/pull/new/build-artifacts-509288b-1770582182.76557
