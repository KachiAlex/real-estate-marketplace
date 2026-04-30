@echo off
REM Batch to start server with staging DB env
set DATABASE_URL=postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark
set DB_REQUIRE_SSL=true
set DB_REJECT_UNAUTHORIZED=false
cd /d %~dp0
node server.js
