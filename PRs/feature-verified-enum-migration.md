# PR: feature/verified-enum-migration

## Summary

This PR standardizes the verification state to `verified` across the backend and adds a safe migration script to ensure the Postgres enum types include the `verified` value.

Changes included:
- Code updates to use `verified` instead of `approved` for verificationStatus.
- Validators, routes, services, notification templates updated.
- Migration helper: `backend/migration/ensure_verified_enum.js` (Sequelize-based) — dry-run friendly.
- Migration script to run as part of deployments: `backend/migrations/add_verified_to_verification_enums.js` (pg Client).
- Several helper scripts for local testing and inspection (local-only tools and smoke tests).

## Why

During local testing we observed a mismatch between code and DB enum values causing 500s (Sequelize error: invalid input value for enum). This change prevents runtime failures by aligning code and DB enums.

## Migration (Runbook)

Run these steps in staging (and then production) in a maintenance window. Ensure you have a DB backup/snapshot before running.

Linux / macOS example:

```bash
export DATABASE_URL='postgres://<user>:<pass>@<host>:<port>/<db>'
export DB_REQUIRE_SSL=true
export DB_REJECT_UNAUTHORIZED=false
cd backend
# If you use a migration runner, prefer that. Otherwise run directly:
node migrations/add_verified_to_verification_enums.js
```

PowerShell example:

```powershell
$env:DATABASE_URL='postgres://<user>:<pass>@<host>:<port>/<db>'
$env:DB_REQUIRE_SSL='true'
$env:DB_REJECT_UNAUTHORIZED='false'
Set-Location -Path backend
node migrations/add_verified_to_verification_enums.js
```

If your org uses a centralized migration tool (Sequelize/Flyway), convert `migrations/add_verified_to_verification_enums.js` into the appropriate migration artifact and run via CI.

## Rollback

Postgres does not support removing individual enum labels easily. If you need to revert, restore the DB from backup or create a new enum and migrate values back. Always test the rollback plan in staging.

## Smoke Test Checklist (post-migration)

- [ ] Run GET /api/health — expect 200
- [ ] Run GET /api/properties — expect 200 and `stats.verified` present
- [ ] Register and login a test user — expect success
- [ ] Run admin KYC flow smoke script (`backend/scripts/adminKycRunLocal.js`) — expect success
- [ ] Verify notification templates reference "Verified" where appropriate

## Notes for reviewers

- The branch includes local helper scripts and logs; review only the migration files and main code changes for semantics.
- Recommend running migrations in staging during low traffic times and verifying the smoke checklist before promoting.
