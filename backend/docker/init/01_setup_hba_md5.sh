#!/bin/bash
set -e

# Init script to write pg_hba.conf with md5 host auth for local dev
# Use only for development; this enforces password authentication for host connections.

cat > "$PGDATA/pg_hba.conf" <<'PGHBA'
# Custom pg_hba.conf for local development - md5 for host connections
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
# Allow any host (0.0.0.0/0) to connect with md5 - dev only
host    all             all             0.0.0.0/0               md5
PGHBA

chown postgres:postgres "$PGDATA/pg_hba.conf"
chmod 600 "$PGDATA/pg_hba.conf"

echo "[init] Wrote custom pg_hba.conf with md5 host auth"
