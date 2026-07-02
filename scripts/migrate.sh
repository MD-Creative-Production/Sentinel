#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Sentinel – Database Migration Workflow
#
# Usage:
#   ./scripts/migrate.sh [command]
#
# Commands:
#   generate    Generate a new migration from schema changes
#   deploy      Apply pending migrations to the database
#   status      Show migration status
#   reset       Reset the database (drops all data)
#   studio      Open Prisma Studio to inspect data
#   create-only Create a migration file without applying it
#
# Environment:
#   DATABASE_URL   Required. PostgreSQL connection string.
#
# Examples:
#   ./scripts/migrate.sh generate
#   ./scripts/migrate.sh deploy
#   DATABASE_URL="postgresql://user:pass@localhost:5432/sentinel" ./scripts/migrate.sh deploy
# ──────────────────────────────────────────────────────────────────────────────

BIN="npx prisma"
SCHEMA="prisma/schema.prisma"

show_help() {
  sed -n '3,20p' "$0"
  exit 0
}

if [ $# -eq 0 ]; then
  show_help
fi

CMD="${1:-}"

case "$CMD" in
  generate)
    echo "✦ Generating Prisma client..."
    $BIN generate --schema="$SCHEMA"
    echo "✓ Prisma client generated"
    ;;

  deploy)
    echo "✦ Deploying pending migrations..."
    $BIN migrate deploy --schema="$SCHEMA"
    echo "✓ Migrations deployed"
    ;;

  status)
    echo "✦ Migration status:"
    $BIN migrate status --schema="$SCHEMA"
    ;;

  reset)
    echo "⚠️  WARNING: This will drop all data in the database!"
    read -rp "Are you sure? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      $BIN migrate reset --schema="$SCHEMA" --force
      echo "✓ Database reset complete"
    else
      echo "Aborted."
    fi
    ;;

  studio)
    echo "✦ Opening Prisma Studio..."
    $BIN studio --schema="$SCHEMA"
    ;;

  create-only)
    echo "✦ Creating migration file (not applied)..."
    read -rp "Migration name: " NAME
    $BIN migrate dev --schema="$SCHEMA" --name "$NAME" --create-only
    echo "✓ Migration file created — review and edit before deploying"
    ;;

  *)
    echo "Unknown command: $CMD"
    show_help
    ;;
esac
