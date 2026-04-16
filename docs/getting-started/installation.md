# Installation

Get Simba up and running on your system in minutes.

---

## Prerequisites

Before installing Simba, ensure you have:

- **Node.js**: Version 20.x or higher
- **PostgreSQL**: Version 14 or higher
- **MongoDB**: Version 6 or higher
- **Git**: For cloning the repository

### Check Your Environment

```bash
node --version  # Should be v20.x or higher
npm --version
postgres --version
mongo --version
```

---

## Installation Methods

=== "Production Deployment"

    ### Using Pre-built Package

    1. **Download the latest release**
    ```bash
    wget https://github.com/skckadiyala/APITestingTool/releases/latest/deploy.zip
    unzip deploy.zip
    cd deploy
    ```

    2. **Configure environment variables**
    ```bash
    # Backend configuration
    cd backend
    cp .env.example .env
    nano .env  # Edit with your database credentials
    ```

    3. **Set up databases**
    ```bash
    # Create PostgreSQL database
    createdb api_testing_tool

    # Run migrations
    cd backend
    npx prisma migrate deploy
    npx prisma generate
    ```

    4. **Install dependencies and start**
    ```bash
    # Install backend dependencies
    cd backend
    npm install --production

    # Install frontend dependencies
    cd ../frontend
    npm install --production

    # Start with PM2
    cd ..
    pm2 start ecosystem.config.js
    ```

=== "Development Setup"

    ### Local Development

    1. **Clone the repository**
    ```bash
    git clone https://github.com/skckadiyala/APITestingTool.git
    cd APITestingTool
    ```

    2. **Start databases with Docker**
    ```bash
    docker-compose up -d
    ```

    3. **Configure backend**
    ```bash
    cd backend
    cp .env.example .env
    # Edit .env with your settings
    npm install
    npx prisma migrate dev
    npx prisma generate
    ```

    4. **Configure frontend**
    ```bash
    cd ../frontend
    cp .env.example .env
    npm install
    ```

    5. **Start development servers**
    ```bash
    # Terminal 1: Backend
    cd backend
    npm run dev

    # Terminal 2: Frontend
    cd frontend
    npm run dev
    ```

    6. **Access the application**
    - Frontend: http://localhost:5174
    - Backend API: http://localhost:5000

=== "Docker Deployment"

    ### Using Docker Compose (Coming Soon)

    ```bash
    docker-compose up -d
    ```

---

## Environment Configuration

### Backend `.env`

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database URLs
DATABASE_URL="postgresql://user:password@localhost:5432/api_testing_tool"
MONGODB_URI="mongodb://localhost:27017/api_testing_tool"

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1d

# CORS Configuration
FRONTEND_URL=http://localhost:5174
CORS_ORIGIN=http://localhost:5174
```

### Frontend `.env`

```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=5000
```

!!! warning "Production Security"
    Always change `JWT_SECRET` to a strong random string in production:
    ```bash
    openssl rand -base64 32
    ```

---

## Database Setup

### PostgreSQL

```bash
# Create database
createdb api_testing_tool

# Run migrations
cd backend
npx prisma migrate deploy

# Optional: Seed with sample data
npm run prisma:seed
```

### MongoDB

```bash
# MongoDB will auto-create database on first connection
# Optional: Seed with sample data
npm run seed:mongo
```

---

## Verify Installation

1. **Check backend health**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "API Testing Tool Backend is running",
  "timestamp": "2026-04-15T..."
}
```

2. **Check frontend**

Open http://localhost:5174 in your browser. You should see the Simba login page.

3. **Create first user**

Register a new account or use the seed user:
- Email: `admin@example.com`
- Password: `password123`

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Database Connection Failed

1. Verify databases are running:
```bash
ps aux | grep postgres
ps aux | grep mongod
```

2. Check connection strings in `.env`

3. Test connection:
```bash
psql -U user -d api_testing_tool
mongosh mongodb://localhost:27017/api_testing_tool
```

### Prisma Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes data)
npx prisma migrate reset
```

---

## Next Steps

✅ Installation complete!

Now you're ready to:

1. [Make your first API request](first-request.md)
2. [Tour the interface](interface-tour.md)
3. [Understand core concepts](../concepts/workspaces.md)

[First Request →](first-request.md){ .md-button .md-button--primary }
