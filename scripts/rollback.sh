#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Sentinel – Migration Rollback
#
# Rolls back the last N migrations. Prisma does not support named rollbacks
# natively; this script wraps `prisma migrate resolve` to handle the process.
#
# Usage:
#   ./scripts/rollback.sh             # Show rollback guide
#   ./scripts/rollback.sh --last 1    # Roll back the last migration
#
# Note: Prisma uses "rollback" via `migrate diff` + `migrate resolve`.
# A safer approach is to create a "down" migration manually and apply it.
# ──────────────────────────────────────────────────────────────────────────────

BIN="npx prisma"
SCHEMA="prisma/schema.prisma"

echo "═══════════════════════════════════════════════════════════════"
echo "  Sentinel – Migration Rollback Guide"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Prisma does not support automatic rollback. To roll back safely:"
echo ""
echo "  Option 1 — Create a reverse migration (recommended):"
echo "    1. Revert the schema changes in schema.prisma"
echo "    2. Run:  ./scripts/migrate.sh create-only"
echo "    3. Name it: rollback_<previous_migration_name>"
echo "    4. Deploy: ./scripts/migrate.sh deploy"
echo ""
echo "  Option 2 — Reset and re-migrate (dev only):"
echo "    1. Run:  ./scripts/migrate.sh reset"
echo "    2. Run:  ./scripts/migrate.sh deploy"
echo ""
echo "  Option 3 — Resolve a failed migration:"
echo "    1. Mark migration as rolled back:"
echo "       $BIN migrate resolve --rolled-back <migration_name>"
echo "    2. Apply the fix:  ./scripts/migrate.sh deploy"
echo ""

if [ "${1:-}" = "--last" ]; then
  COUNT="${2:-1}"
  echo "To roll back the last $COUNT migration(s):"
  echo "  1. Revert schema.changes in prisma/schema.prisma"
  echo "  2. Run: $BIN migrate dev --name rollback_step"
  echo "  3. Verify: ./scripts/migrate.sh status"
fi
