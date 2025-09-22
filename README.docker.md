# Docker Setup for AgTech Certification Backend

This document explains how to run the AgTech Certification Backend using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd agtech-certification-backend
   ```

2. **Start the application**:
   ```bash
   docker-compose up
   ```

   Or run in detached mode:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs
   - Health Check: http://localhost:3001/health

## What's Included

The Docker setup includes:

### Services
- **MySQL Database** (mysql:8.0)
  - Database: `pesira_db`
  - User: `agtech_user`
  - Password: `agtech_password`
  - Port: `3306`

- **Backend Application** (Node.js)
  - Port: `3001`
  - Environment: `production`
  - Auto-restarts on failure

### Features
- **Automatic Database Setup**: SQL schema and migrations are automatically executed
- **Health Checks**: Both services have health checks configured
- **Persistent Data**: MySQL data is stored in Docker volumes
- **File Storage**: Certificate PDFs are stored in mounted volumes

## Environment Variables

The Docker setup uses the following environment variables (configured in docker-compose.yml):

```env
NODE_ENV=production
PORT=3001
DB_HOST=mysql
DB_USER=agtech_user
DB_PASSWORD=agtech_password
DB_DATABASE=pesira_db
JWT_SECRET=your_production_jwt_secret_here
```

## Database Initialization

The database is automatically initialized with:
1. Main schema (`database/schema.sql`)
2. Renewal status migration (`database/add_renewal_status.sql`)
3. Status history migration (`database/add_status_history.sql`)
4. Violations column migration (`database/add_violations_column.sql`)

## Useful Commands

### Start services
```bash
docker-compose up
```

### Start in background
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs mysql
```

### Rebuild and start
```bash
docker-compose up --build
```

### Access database directly
```bash
docker-compose exec mysql mysql -u agtech_user -p pesira_db
# Password: agtech_password
```

### Access backend container
```bash
docker-compose exec backend sh
```

## Production Deployment

For production deployment:

1. **Update environment variables** in `docker-compose.yml`:
   - Change default passwords
   - Update JWT_SECRET
   - Add Firebase configuration

2. **Use environment file**:
   ```bash
   cp .env.docker .env.production
   # Edit .env.production with your values
   docker-compose --env-file .env.production up -d
   ```

3. **Enable SSL/TLS** by adding a reverse proxy (nginx/traefik)

## Troubleshooting

### Database Connection Issues
```bash
# Check if MySQL is running
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Restart services
docker-compose restart
```

### Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend image
docker-compose up --build backend
```

### Reset Everything
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Start fresh
docker-compose up
```

## File Structure

```
agtech-certification-backend/
├── Dockerfile              # Backend container definition
├── docker-compose.yml      # Multi-service orchestration
├── .dockerignore           # Files to exclude from Docker build
├── .env.docker             # Docker environment template
└── README.docker.md        # This file
```