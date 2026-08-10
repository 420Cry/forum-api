#!/usr/bin/env bash
# Local check that SUPABASE_PROJECT_ID + SUPABASE_DB_PASSWORD can open Postgres.
# Does not print the password. Usage:
#
#   export SUPABASE_PROJECT_ID='your-project-ref'
#   export SUPABASE_DB_PASSWORD='your-db-password'   # no wrapping quotes in the value
#   export SUPABASE_ACCESS_TOKEN='sbp_...'            # optional but needed for CLI path
#   ./scripts/ping-supabase-db.sh
#
set -euo pipefail

if [[ -z "${SUPABASE_PROJECT_ID:-}" || -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Set SUPABASE_PROJECT_ID and SUPABASE_DB_PASSWORD in the environment, then re-run."
  exit 1
fi

REF="$SUPABASE_PROJECT_ID"
PASS_LEN=${#SUPABASE_DB_PASSWORD}
echo "Project ref: $REF"
echo "Password length: $PASS_LEN (should be > 0; trailing spaces/newlines inflate this)"

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
import os
p = os.environ["SUPABASE_DB_PASSWORD"]
issues = []
if p != p.strip():
    issues.append("leading/trailing whitespace")
if "\n" in p or "\r" in p:
    issues.append("contains newline")
if (p.startswith("'") and p.endswith("'")) or (p.startswith('"') and p.endswith('"')):
    issues.append("wrapped in quotes — remove them from the GitHub secret")
if issues:
    print("Password paste issues:", ", ".join(issues))
else:
    print("Password paste check: ok (no obvious whitespace/quote issues)")
PY
fi

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo
  echo "== Management API (access token) =="
  code=$(curl -sS -o /tmp/supabase-proj.json -w "%{http_code}" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    "https://api.supabase.com/v1/projects/$REF")
  echo "GET /v1/projects/$REF → HTTP $code"
  if [[ "$code" != "200" ]]; then
    echo "Access token or project ref is wrong (expected HTTP 200)."
    head -c 400 /tmp/supabase-proj.json; echo
  else
    python3 - <<'PY' 2>/dev/null || true
import json
d=json.load(open("/tmp/supabase-proj.json"))
print(f"  name={d.get('name')} region={d.get('region')} status={d.get('status')}")
PY
  fi
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo
echo "== Direct Postgres via Node pg (db.$REF.supabase.co:5432) =="
if [[ -d "$ROOT/node_modules/pg" ]] || bun pm ls pg >/dev/null 2>&1; then
  set +e
  bun -e '
    import pg from "pg";
    const ref = process.env.SUPABASE_PROJECT_ID;
    const client = new pg.Client({
      host: `db.${ref}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: process.env.SUPABASE_DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15_000,
    });
    try {
      await client.connect();
      const r = await client.query("select current_user, current_database()");
      console.log("Direct connection: OK", r.rows[0]);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.error("Direct connection: FAILED");
      console.error(String(e?.message || e));
      process.exit(1);
    }
  '
  DIRECT_RC=$?
  set -e
else
  echo "pg package missing — run bun install in forum-api, or install psql."
  DIRECT_RC=2
fi

echo
echo "== Same path as CI (link --skip-pooler -p … + db push --dry-run) =="
if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI missing"
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Set SUPABASE_ACCESS_TOKEN to exercise the same path as GitHub Actions."
  exit "$DIRECT_RC"
fi

# Non-interactive: pass password + skip pooler (matches updated GH workflow).
supabase link \
  --project-ref "$REF" \
  --password "$SUPABASE_DB_PASSWORD" \
  --skip-pooler \
  --yes

set +e
supabase db push --password "$SUPABASE_DB_PASSWORD" --dry-run --yes
PUSH_RC=$?
set -e

if [[ $PUSH_RC -eq 0 ]]; then
  echo "CI-equivalent auth path: OK (dry-run connected)"
else
  echo "CI-equivalent auth path: FAILED (exit $PUSH_RC)"
fi

exit $(( DIRECT_RC != 0 ? DIRECT_RC : PUSH_RC ))
