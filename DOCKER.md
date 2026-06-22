# Docker Development Environment Setup

This guide provides instructions for running Sentinel with Docker and Docker Compose, ensuring a reproducible development environment for all contributors.

## Prerequisites

- **Docker**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Engine and Docker Compose)
- **Git**: For version control
- Minimum 2GB available disk space
- Ports 3000 (backend), 5432 (PostgreSQL), and 6379 (Redis) available

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone and Navigate

```bash
git clone https://github.com/sentinel-security-productions/Sentinel.git
cd Sentinel
```

### 2. Start Services

```bash
# Start all services (background mode)
docker-compose up -d

# Or, start with logs visible (remove -d flag)
docker-compose up
```

### 3. Initialize Database

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Or for development with new schema changes
docker-compose exec backend npx prisma migrate dev
```

### 4. Verify Services

```bash
# Check all services are running
docker-compose ps

# Test backend health
curl http://localhost:3000/api

# Test PostgreSQL connection
docker-compose exec postgres psql -U sentinel_user -d sentinel_db -c "\dt"

# Test Redis connection
docker-compose exec redis redis-cli ping
```

## Services Overview

### Backend Application (NestJS)

- **Port**: 3000
- **URL**: http://localhost:3000/api
- **Container**: sentinel-backend
- **Features**:
  - Auto-reload on code changes (volume mounted)
  - Health check enabled
  - Proper signal handling via dumb-init

### PostgreSQL Database

- **Port**: 5432
- **Container**: sentinel-postgres
- **Credentials**:
  - Username: `sentinel_user` (configurable)
  - Password: `sentinel_password` (configurable)
  - Database: `sentinel_db` (configurable)
- **Volume**: `postgres_data` (persisted)
- **Connection String**: `postgresql://sentinel_user:sentinel_password@localhost:5432/sentinel_db`

### Redis Cache

- **Port**: 6379
- **Container**: sentinel-redis
- **Volume**: `redis_data` (persisted)
- **Connection**: `redis://localhost:6379`

## Configuration

### Environment Variables

Configure services using `.env.docker` (default) or create a `.env` file:

```bash
# Node environment
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_USER=sentinel_user
DB_PASSWORD=sentinel_password
DB_NAME=sentinel_db

# Redis (auto-configured)
REDIS_URL=redis://redis:6379
```

To use custom values:

```bash
# Using environment file
docker-compose --env-file .env.custom up -d

# Or set inline
DATABASE_URL="postgresql://custom_user:custom_pass@postgres:5432/custom_db" docker-compose up -d
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 50 lines
docker-compose logs --tail 50
```

### Execute Commands in Container

```bash
# Backend (NestJS)
docker-compose exec backend npm install
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma generate

# PostgreSQL
docker-compose exec postgres psql -U sentinel_user -d sentinel_db
docker-compose exec postgres pg_dump -U sentinel_user sentinel_db > backup.sql

# Redis
docker-compose exec redis redis-cli
docker-compose exec redis redis-cli FLUSHALL
```

### Stop and Clean Up

```bash
# Stop services (keeps volumes)
docker-compose stop

# Stop and remove containers
docker-compose down

# Full cleanup (removes volumes - DATA LOSS!)
docker-compose down -v

# Remove images too
docker-compose down -v --rmi all
```

### Rebuild Services

```bash
# Rebuild backend after dependency changes
docker-compose build backend

# Rebuild all services
docker-compose build

# Rebuild and restart
docker-compose up -d --build
```

## Development Workflow

### Local Development with Hot Reload

The backend service is configured with volume mounting for hot reload:

```bash
# Start services
docker-compose up -d

# Edit files locally, they'll be reflected in the container
# Monitor logs
docker-compose logs -f backend
```

**Note**: Some NestJS changes may require a container restart:

```bash
docker-compose restart backend
```

### Database Migrations

```bash
# Create new migration
docker-compose exec backend npx prisma migrate dev --name add_feature

# Apply existing migrations
docker-compose exec backend npx prisma migrate deploy

# Reset database (development only - clears all data!)
docker-compose exec backend npx prisma migrate reset
```

### Accessing Databases

#### PostgreSQL with psql

```bash
docker-compose exec postgres psql -U sentinel_user -d sentinel_db

# Example queries
\dt                          # List tables
\d users                     # Describe users table
SELECT * FROM users LIMIT 5; # Query data
```

#### Prisma Studio (GUI)

```bash
docker-compose exec backend npx prisma studio
```

Opens interactive database UI at http://localhost:5555 (in container)

#### Redis CLI

```bash
docker-compose exec redis redis-cli

# Example commands
KEYS *
GET key_name
FLUSHALL
```

## Troubleshooting

### Services Won't Start

```bash
# Check for port conflicts
docker-compose ps
lsof -i :3000  # Check port usage

# Clean up and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Errors

```bash
# Verify PostgreSQL is healthy
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection manually
docker-compose exec postgres pg_isready -U sentinel_user
```

### Redis Connection Issues

```bash
# Verify Redis is running
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

### Backend Not Starting

```bash
# Check backend logs
docker-compose logs backend

# Verify dependencies installed
docker-compose exec backend npm list

# Rebuild backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Data Persistence Issues

```bash
# Check volumes
docker volume ls | grep sentinel

# Inspect volume
docker volume inspect sentinel_postgres_data

# Data persists across restarts unless you use docker-compose down -v
```

## Production Considerations

For production deployments:

1. **Use environment-specific `.env` files** for secrets management
2. **Enable container restart policies** (already configured: `restart: unless-stopped`)
3. **Configure persistent volume backups** for PostgreSQL data
4. **Use secrets management** (Docker Secrets or external vault)
5. **Enable logging drivers** for centralized log aggregation
6. **Configure resource limits** in docker-compose.yml
7. **Use healthchecks** (already configured)
8. **Enable HTTPS** via reverse proxy (nginx/Traefik)

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/deployment/docker)
- [Prisma Docker Guide](https://www.prisma.io/docs/concepts/database/prisma-and-docker)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)

## Support

For issues or questions:

1. Check [existing issues](https://github.com/sentinel-security-productions/Sentinel/issues)
2. Review logs: `docker-compose logs`
3. Create a new issue with:
   - Docker version
   - Docker Compose version
   - OS information
   - Relevant logs
   - Steps to reproduce
