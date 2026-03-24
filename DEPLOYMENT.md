# API Testing Tool - Deployment Guide

Complete guide to deploy the API Testing Tool from scratch, including all prerequisites, database setup, and deployment options.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Database Setup](#database-setup)
4. [Application Setup](#application-setup)
5. [Development Deployment](#development-deployment)
6. [Production Deployment](#production-deployment)
7. [Docker Deployment](#docker-deployment)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **OS**: macOS, Linux (Ubuntu 20.04+), or Windows 10+

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB free space

---

## Prerequisites Installation

### 1. Node.js Installation

The application requires **Node.js 20.x (LTS) or higher**.

**Important for Prisma 7 Users**: The project uses Prisma 7.5.0, which officially supports:
- Node.js 20.19+
- Node.js 22.12+  
- Node.js 24.0+

Node.js 23.x may work but is not officially supported by Prisma.

#### macOS

**Option A: Using Homebrew (Recommended)**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

**Option B: Using Official Installer**
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Verify: `node --version`

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Windows

**Option A: Using Installer**
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the MSI installer
3. Follow installation wizard
4. Verify in PowerShell: `node --version`

**Option B: Using Chocolatey**
```powershell
# Install Chocolatey first (if not installed)
# Then install Node.js
choco install nodejs-lts

# Verify
node --version
```

---

### 2. PostgreSQL Installation

The application requires **PostgreSQL 14 or higher**.

#### macOS

**Option A: Using Homebrew (Recommended)**
```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Verify installation
psql --version
```

**Option B: Using Postgres.app**
1. Download from [postgresapp.com](https://postgresapp.com/)
2. Move to Applications folder
3. Open Postgres.app
4. Initialize server

**Create Database and User**

```

#### Linux (Ubuntu/Debian)

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install PostgreSQL
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

**Create Database and User**
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE USER user WITH PASSWORD 'password';
CREATE DATABASE api_testing_tool;
GRANT ALL PRIVILEGES ON DATABASE api_testing_tool TO user;
\q
```

#### Windows

**Using Official Installer**
1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer
3. During installation:
   - Set password for postgres user
   - Keep default port (5432)
   - Install pgAdmin (optional but recommended)
4. Complete installation

**Create Database and User**
```sql
-- Open pgAdmin or psql
-- Run these commands:
CREATE USER "user" WITH PASSWORD 'password';
CREATE DATABASE api_testing_tool;
GRANT ALL PRIVILEGES ON DATABASE api_testing_tool TO "user";
```

**Configure PostgreSQL (Windows specific)**
```bash
# If psql is not in PATH, add it:
# Add to System Environment Variables:
# C:\Program Files\PostgreSQL\16\bin
```

---

### 3. MongoDB Installation

The application requires **MongoDB 6 or higher**.

#### macOS

**Using Homebrew (Recommended)**
```bash
# Add MongoDB tap
brew tap mongodb/brew

# Install MongoDB Community Edition
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify installation
mongosh --version
```

**Manual Installation**
1. Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Extract the archive
3. Add to PATH: `export PATH="/path/to/mongodb/bin:$PATH"`
4. Create data directory: `sudo mkdir -p /data/db`
5. Set permissions: `sudo chown -R $(whoami) /data/db`
6. Start MongoDB: `mongod`

#### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongosh --version
```

#### Windows

**Using Official Installer**
1. Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the MSI installer
3. Choose "Complete" installation
4. Install MongoDB as a Service (recommended)
5. Install MongoDB Compass (optional GUI)
6. Complete installation

**Verify Installation**
```powershell
# Check MongoDB service status
net start | findstr MongoDB

# Test MongoDB connection
mongosh
```

**Configure MongoDB (if needed)**
```bash
# Create data directory if not exists
mkdir C:\data\db

# Start MongoDB (if not running as service)
mongod --dbpath C:\data\db
```

---

### 4. Git Installation (if not already installed)

#### macOS
```bash
brew install git
```

#### Linux
```bash
sudo apt install git
```

#### Windows
Download from [git-scm.com](https://git-scm.com/download/win) or use `choco install git`

---

## Database Setup

### Option A: Manual Database Creation

**PostgreSQL Setup**
```bash
# Connect to PostgreSQL
psql -U user -d postgres

# Create database
CREATE DATABASE api_testing_tool;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE api_testing_tool TO user;

# Verify database exists
\l
\q
```

**MongoDB Setup**
```bash
# Connect to MongoDB
mongosh

# Create database (automatically created on first use)
use api_testing_tool

# Verify database
show dbs
exit
```

### Option B: Using Docker (Recommended for Development)

See [Docker Deployment](#docker-deployment) section below.

---

## Application Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd APITestingTool

# Or if you already have it
cd /path/to/APITestingTool
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file from example
cp .env.example .env
```

**Edit backend/.env file** with your database credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=api_testing_tool

MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB=api_testing_tool

# Database URLs
DATABASE_URL="postgresql://user:password@localhost:5432/api_testing_tool?schema=public"
MONGODB_URI="mongodb://localhost:27017/api_testing_tool"

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
```

**Generate Prisma Client and Run Migrations**

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
# Note: Prisma 7 requires DATABASE_URL to be passed via --url flag
npm run prisma:migrate

# (Optional) Seed the database with sample data
npm run seed:all
```

**Important for Prisma 7**: The migration script uses `dotenv-cli` and the `--url` flag to pass the DATABASE_URL from your `.env` file. The script command is:
```bash
dotenv -e .env -- sh -c 'prisma migrate dev --url="$DATABASE_URL"'
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file from example
cp .env.example .env
```

**Edit frontend/.env file**:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=5000

# Frontend Configuration
VITE_FRONTEND_HOST=localhost
VITE_FRONTEND_PORT=5173
```

---

## Development Deployment

### Starting the Application in Development Mode

**Terminal 1: Start Backend**
```bash
cd backend
npm run dev
```

Backend will start at `http://localhost:5000`

**Terminal 2: Start Frontend**
```bash
cd frontend
npm run dev
```

Frontend will start at `http://localhost:5173`

**Access the Application**
Open your browser and navigate to: `http://localhost:5173`

---

## Production Deployment

### 1. Build the Application

**Build Backend**
```bash
cd backend
npm install --production=false
npm run build

# Verify build
ls -la dist/
```

**Build Frontend**
```bash
cd frontend
npm install --production=false
npm run build

# Verify build
ls -la dist/
```

### 2. Install Production Dependencies

```bash
# Backend
cd backend
npm install --production

# Frontend (for serving)
npm install -g serve
# or
npm install -g http-server
```

### 3. Production Environment Configuration

**Update backend/.env for production**:
```env
NODE_ENV=production
PORT=5000

# Use strong, randomly generated secrets in production!
JWT_SECRET=<generate-a-strong-random-secret-key-here>
JWT_REFRESH_SECRET=<generate-another-strong-random-secret-key>

# Update URLs for your production domain
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Production database URLs
DATABASE_URL="postgresql://user:password@your-db-host:5432/api_testing_tool?schema=public"
MONGODB_URI="mongodb://your-mongodb-host:27017/api_testing_tool"
```

**Generate Production Secrets**:
```bash
# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Run Database Migrations in Production

```bash
cd backend
npm run prisma:migrate
```

### 5. Option A: Manual Production Deployment

**Start Backend**
```bash
cd backend
NODE_ENV=production node dist/app.js
```

**Serve Frontend**
```bash
cd frontend
serve -s dist -l 5173
# or
http-server dist -p 5173
```

### 6. Option B: Using PM2 (Recommended)

PM2 is a production process manager for Node.js applications.

**Install PM2**
```bash
npm install -g pm2
```

**Configure PM2**

The repository includes `ecosystem.config.js`. Update it for your system:

```javascript
module.exports = {
  apps: [
    {
      name: 'api-testing-backend',
      cwd: './backend',
      script: 'node',
      args: 'dist/app.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'api-testing-frontend',
      cwd: './frontend',
      script: 'serve',
      args: 'dist -l 5173',
      env: {
        PORT: 5173
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
```

**Create logs directory**
```bash
mkdir -p logs
```

**Start with PM2**
```bash
# From project root
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs

# Monitor
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown
```

**PM2 Management Commands**
```bash
# Restart applications
pm2 restart all

# Stop applications
pm2 stop all

# Delete applications from PM2
pm2 delete all

# View detailed info
pm2 info api-testing-backend

# View logs for specific app
pm2 logs api-testing-backend
```

---

## Docker Deployment

Docker provides the easiest way to deploy with all dependencies managed automatically.

### 1. Install Docker

#### macOS
Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin
```

#### Windows
Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

### 2. Verify Docker Installation

```bash
docker --version
docker-compose --version
```

### 3. Start Databases with Docker

The provided `docker-compose.yml` sets up PostgreSQL and MongoDB:

```bash
# Start databases in detached mode
docker-compose up -d

# View running containers
docker ps

# View logs
docker-compose logs -f

# Stop databases
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data!)
docker-compose down -v
```

### 4. Using Docker for Full Application (Optional)

If you want to containerize the entire application, create these Dockerfiles:

**backend/Dockerfile**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist
COPY .env ./.env

EXPOSE 5000

CMD ["node", "dist/app.js"]
```

**frontend/Dockerfile**
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Post-Deployment Steps

### 1. Verify Databases are Running

**PostgreSQL**
```bash
psql -U user -h localhost -d api_testing_tool
# Should connect successfully
```

**MongoDB**
```bash
mongosh --host localhost --port 27017
# Should connect successfully
```

### 2. Test Backend API

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Or in browser
open http://localhost:5000/api/v1/health
```

### 3. Access Frontend

Open browser: `http://localhost:5173`

### 4. Create First User

Register a new account through the UI or use the API:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "Admin User"
  }'
```

---

## Troubleshooting

### Database Connection Issues

**PostgreSQL Connection Failed**
```bash
# Check if PostgreSQL is running
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Test connection
psql -U user -h localhost -d api_testing_tool

# If connection refused, check pg_hba.conf allows local connections
```

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# Test connection
mongosh --host localhost --port 27017

# View MongoDB logs
# macOS
tail -f /usr/local/var/log/mongodb/mongo.log

# Linux
sudo tail -f /var/log/mongodb/mongod.log
```

### Port Already in Use

```bash
# Find process using port 5000 (backend)
lsof -i :5000
# Kill the process
kill -9 <PID>

# Find process using port 5173 (frontend)
lsof -i :5173
kill -9 <PID>
```

### Prisma Generation Issues

**Error: "datasource property `url` is no longer supported"**

This occurs with Prisma 7+. The project is configured to use Prisma 7's adapter pattern:

```bash
# Prisma 7 requires @prisma/adapter-pg for PostgreSQL
npm install @prisma/adapter-pg pg

# Then regenerate
npm run prisma:generate
```

The configuration uses:
- `prisma/prisma.config.ts` - Database config (TypeScript)
- `prisma/prisma.config.js` - Compiled config (generated)
- `src/config/prisma.ts` - Runtime adapter with pg Pool

**Prisma Version Mismatch**

```bash
# Check versions
npm list prisma @prisma/client

# If mismatched, align them
npm install prisma@7.5.0 @prisma/client@7.5.0 --save-exact
```

**Migration Command Requires DATABASE_URL**

For Prisma 7, migrations use the `--url` flag to bypass config file issues:

```bash
# The package.json script handles this automatically
npm run prisma:migrate

# Or run directly with environment variable
dotenv -e .env -- sh -c 'prisma migrate dev --url="$DATABASE_URL"'

# Or with explicit URL
npx prisma migrate dev --url="postgresql://user:password@localhost:5432/api_testing_tool?schema=public"
```

### Prisma Migration Issues

```bash
# Reset database (WARNING: Deletes all data)
cd backend
npm run prisma:migrate reset

# Push schema without migration
npx prisma db push

# View migration status
npx prisma migrate status
```

### Node Module Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### PM2 Issues

```bash
# View PM2 logs
pm2 logs --lines 100

# Reset PM2
pm2 kill
pm2 start ecosystem.config.js

# Update PM2
npm install -g pm2@latest
pm2 update
```

### Environment Variable Issues

```bash
# Verify .env file is loaded
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Check for syntax errors in .env
cat backend/.env
```

### Build Errors

```bash
# Backend build
cd backend
rm -rf dist
npm run build

# Frontend build
cd frontend
rm -rf dist
npm run build
```

---

## Prisma 7 Migration Notes

This project uses **Prisma 7.5.0** which introduced breaking changes from earlier versions:

### Key Changes in Prisma 7

1. **No `url` in schema.prisma**: Database connection URLs are no longer defined in `schema.prisma`
   
2. **Adapter Pattern Required**: Runtime database connections now use adapters:
   - PostgreSQL: `@prisma/adapter-pg` with `pg` driver
   - Configuration in `src/config/prisma.ts`

3. **Migration URL via Flag**: Migrations use the `--url` flag instead of reading from config files:
   - Script: `dotenv -e .env -- sh -c 'prisma migrate dev --url="$DATABASE_URL"'`
   - This workaround solves config file loading issues in Prisma 7

### File Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # No url property in datasource
│   └── prisma.config.ts       # Migration database config
└── src/
    └── config/
        └── prisma.ts          # Runtime PrismaClient with adapter
```

### Required Packages

```json
{
  "dependencies": {
    "@prisma/client": "7.5.0",
    "@prisma/adapter-pg": "^7.5.0",
    "pg": "^8.11.0",
    "prisma": "7.5.0"
  }
}
```

### Migration from Prisma 5 to 7

If upgrading from Prisma 5.x:

1. Update packages:
   ```bash
   npm install prisma@7.5.0 @prisma/client@7.5.0 @prisma/adapter-pg pg
   ```

2. Remove `url` from `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     // Remove: url = env("DATABASE_URL")
   }
   ```

3. Create `prisma/prisma.config.ts`:
   ```typescript
   export default {
     datasources: {
       db: {
         url: process.env.DATABASE_URL
       }
     }
   };
   ```

4. Update PrismaClient initialization (see `src/config/prisma.ts` for reference)

5. Regenerate and test:
   ```bash
   npm run prisma:generate
   npm run build
   ```

For more details, see [Prisma 7 Upgrade Guide](https://pris.ly/d/major-version-upgrade).

---

## Production Checklist

Before deploying to production, ensure:

- [ ] All JWT secrets are changed from default values
- [ ] Database passwords are strong and unique
- [ ] `NODE_ENV=production` is set
- [ ] CORS origins are correctly configured
- [ ] SSL/TLS certificates are installed (use Let's Encrypt)
- [ ] Firewall rules are configured
- [ ] Database backups are automated
- [ ] PM2 is configured to start on system boot
- [ ] Logs are being monitored
- [ ] Rate limiting is enabled
- [ ] Email SMTP is configured (for password resets)
- [ ] Domain names are properly configured
- [ ] Reverse proxy (Nginx/Apache) is set up if needed

---

## Security Recommendations

### 1. Use Environment Variables
Never commit `.env` files with sensitive data to version control.

### 2. Strong Passwords and Secrets
```bash
# Generate secure random strings
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Security
- Use strong database passwords
- Restrict database access to localhost or specific IPs
- Enable SSL/TLS for database connections in production

### 4. Firewall Configuration
```bash
# Ubuntu/Debian - Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 5. Regular Updates
```bash
# Keep dependencies updated
npm update
npm audit fix

# Update system packages
sudo apt update && sudo apt upgrade  # Linux
brew upgrade  # macOS
```

---

## Nginx Reverse Proxy (Optional)

For production deployments, it's recommended to use Nginx as a reverse proxy.

**Install Nginx**
```bash
# Ubuntu/Debian
sudo apt install nginx

# macOS
brew install nginx
```

**Configure Nginx** (`/etc/nginx/sites-available/api-testing-tool`)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable and restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/api-testing-tool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Support and Resources

- **Project Repository**: [Your GitHub URL]
- **Issues**: [Your GitHub Issues URL]
- **Documentation**: See [README.md](README.md)
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **MongoDB Docs**: https://www.mongodb.com/docs/
- **Node.js Docs**: https://nodejs.org/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs/

---

## Backup and Recovery

### Database Backups

**PostgreSQL Backup**
```bash
# Backup
pg_dump -U user -h localhost api_testing_tool > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql -U user -h localhost api_testing_tool < backup_20260323_120000.sql
```

**MongoDB Backup**
```bash
# Backup
mongodump --db api_testing_tool --out backup_$(date +%Y%m%d_%H%M%S)

# Restore
mongorestore --db api_testing_tool backup_20260323_120000/api_testing_tool
```

**Automate Backups with Cron**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

---

## Conclusion

You now have a complete guide to deploy the API Testing Tool. Follow the steps sequentially, and refer to the troubleshooting section if you encounter any issues.

For any questions or issues, please open an issue in the project repository.

Happy Testing! 🚀
