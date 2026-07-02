# GitHub Actions CI Pipeline

This project uses GitHub Actions to automate code quality checks, testing, and build verification on every pull request and push.

## Workflows Overview

### 1. CI Workflow (`ci.yml`)

**Triggers:** On push to `main`/`develop` and all pull requests  
**Purpose:** Validates code quality, runs tests, and verifies builds

**Jobs:**

- **Linting** (`lint`)
  - Runs on Node 20.x and 22.x
  - Executes ESLint checks
  - Verifies code formatting with Prettier
  - Fails if violations found

- **Build** (`build`)
  - Runs on Node 20.x and 22.x
  - Installs dependencies
  - Generates Prisma client
  - Compiles TypeScript
  - Uploads build artifacts

- **Tests** (`test`)
  - Runs on Node 20.x and 22.x
  - Provides PostgreSQL 16 and Redis 7 services
  - Runs test suite with coverage
  - Uploads coverage reports

- **Docker Build Check** (`docker-build`)
  - Validates Dockerfile builds successfully
  - Uses build cache for efficiency
  - No Docker image push

- **CI Status** (`ci-status`)
  - Final status check
  - Aggregates all job results
  - Prevents merge if any job fails

### 2. Code Quality & Security Workflow (`code-quality.yml`)

**Triggers:** On push, pull requests, and daily schedule (2 AM UTC)  
**Purpose:** Analyzes code quality and security vulnerabilities

**Jobs:**

- **Code Quality Analysis** (`code-quality`)
  - Lists dependencies
  - Checks for unused packages

- **Dependency Security Scan** (`dependency-check`)
  - Runs `npm audit` for production dependencies
  - Runs full `npm audit` including dev dependencies
  - Reports vulnerabilities (non-blocking)

- **TypeScript Type Checking** (`type-check`)
  - Strict TypeScript validation
  - Ensures no type errors

## Local Development

Before pushing, run these checks locally to catch issues early:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build application
npm run build

# Generate Prisma client
npm run prisma:generate

# Run tests (when implemented)
npm test
```

### Pre-commit Hook (Recommended)

Install a pre-commit hook to run linting and formatting automatically:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
npm run lint:fix
npm run format
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

## Script Reference

### NPM Scripts

| Script                    | Purpose                              |
| ------------------------- | ------------------------------------ |
| `npm run build`           | Compile TypeScript to JavaScript     |
| `npm run lint`            | Check code with ESLint               |
| `npm run lint:fix`        | Fix linting issues automatically     |
| `npm run format`          | Format code with Prettier            |
| `npm run format:check`    | Check if code matches Prettier rules |
| `npm test`                | Run test suite                       |
| `npm run test:ci`         | Run tests in CI mode with coverage   |
| `npm run prisma:generate` | Generate Prisma client               |

## Pull Request Requirements

Before a pull request can be merged, all of the following must pass:

✅ **Linting** - No ESLint violations  
✅ **Formatting** - Code matches Prettier rules  
✅ **Build** - TypeScript compilation succeeds  
✅ **Tests** - All tests pass  
✅ **Docker Build** - Dockerfile builds without errors

## GitHub PR Template

A PR template is provided at `.github/PULL_REQUEST_TEMPLATE.md` to guide contributors. It includes:

- Change description
- Type of change
- Related issues
- Testing checklist
- Code quality checklist

## Troubleshooting

### Build fails with "command not found"

Ensure dependencies are installed:

```bash
npm ci
```

### Linting fails locally but not in CI

Make sure you're on the same Node version as CI (check `.github/workflows/ci.yml`):

```bash
node --version  # Should be v20.x or v22.x
nvm use 22      # Switch to Node 22
```

### ESLint errors

Fix automatically:

```bash
npm run lint:fix
```

### Prettier formatting issues

Format entire codebase:

```bash
npm run format
```

### Prisma generation fails

Regenerate Prisma client:

```bash
npm run prisma:generate
```

### Tests fail in CI but pass locally

Check if services (PostgreSQL, Redis) are running:

```bash
docker-compose up -d postgres redis
npm test
```

## Workflow Status Badge

Add this to your README to show CI status:

```markdown
[![CI](https://github.com/sentinel-security-productions/Sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/sentinel-security-productions/Sentinel/actions/workflows/ci.yml)
[![Code Quality & Security](https://github.com/sentinel-security-productions/Sentinel/actions/workflows/code-quality.yml/badge.svg)](https://github.com/sentinel-security-productions/Sentinel/actions/workflows/code-quality.yml)
```

## Workflow Files Location

- Main CI: `.github/workflows/ci.yml`
- Code Quality: `.github/workflows/code-quality.yml`
- PR Template: `.github/PULL_REQUEST_TEMPLATE.md`

## Environment Variables

CI jobs use the following environment variables:

| Variable       | Value                                                         | Purpose                  |
| -------------- | ------------------------------------------------------------- | ------------------------ |
| `DATABASE_URL` | `postgresql://test_user:test_password@localhost:5432/test_db` | Test database connection |
| `REDIS_URL`    | `redis://localhost:6379`                                      | Test Redis connection    |

## Performance Notes

- Workflows use GitHub Actions cache for npm dependencies
- Docker builds use layer caching to speed up subsequent runs
- Node matrix (20.x and 22.x) tests compatibility
- Parallel job execution reduces total pipeline time

## Maintenance

### Update Node versions

Edit `.github/workflows/*.yml` and update:

```yaml
matrix:
  node-version: [20.x, 22.x] # Update here
```

### Update dependencies

Keep ESLint, Prettier, and TypeScript packages up to date:

```bash
npm update @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier
```

### Adding new checks

Create new workflow files in `.github/workflows/` following the same pattern.

## Next Steps

1. **Implement tests**: Update `test` script in `package.json`
2. **Configure coverage reporting**: Add coverage thresholds
3. **Setup branch protection rules**: Require CI to pass before merge
4. **Add SARIF reports**: For security scanning results
5. **Integrate with external services**: CodeCov, SonarQube, etc.

## Support

For issues with CI:

1. Check workflow logs in GitHub Actions tab
2. Review this documentation
3. Test locally with same Node version
4. Open an issue with workflow logs attached
