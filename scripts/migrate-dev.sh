#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Sentinel – Development Migration Workflow
#
# Runs the full dev cycle: generate client → apply pending → create new
# migration if schema changed → seed (if applicable).
#
# Usage:
#   ./scripts/migrate-dev.sh [name]
#
#   name   Optional. If provided, creates a named migration for schema changes.
#          If omitted, only applies pending migrations and re-generates client.
# ──────────────────────────────────────────────────────────────────────────────

BIN="npx prisma"
SCHEMA="prisma/schema.prisma"

echo "✦ Step 1 — Generate Prisma client"
$BIN generate --schema="$SCHEMA"

echo ""
echo "✦ Step 2 — Apply pending migrations"
$BIN migrate deploy --schema="$SCHEMA"

NAME="${1:-}"
if [ -n "$NAME" ]; then
  echo ""
  echo "✦ Step 3 — Create migration: $NAME"
  $BIN migrate dev --schema="$SCHEMA" --name "$NAME"
  echo "✓ Migration '$NAME' created and applied"
fi

echo ""
echo "✓ Development migration cycle complete"
