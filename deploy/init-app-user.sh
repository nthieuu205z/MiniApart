#!/bin/sh
set -eu
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}"
psql --username "$POSTGRES_USER" --dbname "${POSTGRES_DB:-miniapart}" --set=ON_ERROR_STOP=1 --set=app_password="$APP_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE miniapart_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'miniapart_app') \gexec
SELECT format('ALTER ROLE miniapart_app PASSWORD %L', :'app_password') \gexec
GRANT CONNECT ON DATABASE miniapart TO miniapart_app;
GRANT USAGE ON SCHEMA public TO miniapart_app;
SQL
