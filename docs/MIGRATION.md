# Database Migration Workflow

Sentinel uses [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate) for schema management. This document describes the migration workflow for local development and production deployments.

## Prerequisites

- Node.js 20+ and dependencies installed (`npm install`)
- PostgreSQL instance running (local, Docker, or remote)
- `DATABASE_URL` environment variable set

## Migration Scripts

All migration commands are available via npm scripts or directly through shell scripts in `scripts/`.

### Quick Reference

| Command | Purpose |
|---|---|
| `npm run prisma:migrate:deploy` | Apply all pending migrations |
| `npm run prisma:migrate:status` | Show which migrations have been applied |
| `npm run db:migrate:new` | Create a migration file without applying it |
| `npm run db:migrate:dev [name]` | Full dev cycle: generate client + apply + create migration |
| `npm run db:status` | Check migration status |
| `npm run db:rollback:guide` | Print rollback instructions |
| `npm run prisma:studio` | Open Prisma Studio to inspect data |
| `npm run prisma:migrate:reset` | Reset database (drops all data) |

## Development Workflow

### 1. Make schema changes

Edit `prisma/schema.prisma` to add/modify models, fields, or relations.

### 2. Run the migration

```bash
# Apply pending migrations and create a new migration for your changes
npm run db:migrate:dev add_user_roles
```

This runs:
1. `prisma generate` — regenerates the Prisma client
2. `prisma migrate deploy` — applies any pending migrations from other developers
3. `prisma migrate dev --name add_user_roles` — creates and applies the new migration

### 3. Generate Prisma client (if needed)

```bash
npm run prisma:generate
```

### 4. Verify migration status

```bash
npm run prisma:migrate:status
```

## Production Deployment

### Applying migrations

```bash
# Set the production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@prod-host:5432/sentinel"

# Apply migrations
npm run prisma:migrate:deploy
```

### Via Docker

Migrations run automatically during Docker startup via the entrypoint. To run manually:

```bash
npm run docker:db:migrate
```

## Rollback Strategy

Prisma Migrate does not support automatic rollback. Follow these steps:

### Option 1 — Reverse migration (recommended)

1. Revert the schema changes in `prisma/schema.prisma`
2. Create a reverse migration:
   ```bash
   npm run db:migrate:new
   # Name it: rollback_<original_migration_name>
   ```
3. Review and edit the generated migration file
4. Deploy:
   ```bash
   npm run prisma:migrate:deploy
   ```

### Option 2 — Reset (development only)

```bash
npm run prisma:migrate:reset
```

This drops all data and re-applies all migrations.

### Option 3 — Mark a failed migration as rolled back

If a migration was partially applied:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

Then fix the issue and create a new migration.

## CI/CD Integration

The CI pipeline (`ci.yml`) runs `prisma:generate` as part of the build step. For deployments, add the following step after build:

```yaml
- name: Run database migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Best Practices

1. **One change per migration** — Keep migrations focused on a single schema change
2. **Review migration SQL** — Always review the generated SQL before deploying
3. **Never edit applied migrations** — Create new migrations instead
4. **Commit migration files** — All migration files in `prisma/migrations/` must be committed
5. **Back up production DB** — Before deploying migrations to production
6. **Test locally first** — Always run migrations against a local copy of the database
