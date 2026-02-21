#!/bin/bash
set -e

# This script runs during Docker Postgres initialization and replaces pg_hba.conf
# WARNING: This configuration uses TRUST for host connections and is intended
# only for local development.

cat > "$PGDATA/pg_hba.conf" <<'PGHBA'
# Custom pg_hba.conf for local development - TRUST all hosts
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
# Allow any host (0.0.0.0/0) to connect as any user without password - dev only
host    all             all             0.0.0.0/0               trust
PGHBA

chown postgres:postgres "$PGDATA/pg_hba.conf"
chmod 600 "$PGDATA/pg_hba.conf"

echo "[init] Wrote custom pg_hba.conf for development"
