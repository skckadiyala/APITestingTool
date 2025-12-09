# Backend - API Testing Tool

Backend API server for the API Testing Tool built with Express.js, TypeScript, PostgreSQL, and MongoDB.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Databases**: 
  - PostgreSQL (via Prisma ORM) - User data, collections, requests metadata
  - MongoDB (via Mongoose) - Request/response bodies, large payloads
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 14+
- MongoDB 6+
- Docker & Docker Compose (optional, recommended)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update the values:
- Database URLs
- JWT secrets
- CORS origin
- Email configuration (optional)

### 3. Start Databases

**Option A: Using Docker Compose (Recommended)**
```bash
# From project root
docker-compose up -d
```

**Option B: Local Installation**
- Install PostgreSQL and MongoDB locally
- Update `.env` with your local connection strings

### 4. Setup Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 5. Run Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── config/             # Configuration files
│   │   └── database.ts     # MongoDB connection
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB models
│   │   ├── RequestBody.ts
│   │   └── ResponseBody.ts
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── prisma/
│   └── schema.prisma       # Prisma schema
├── package.json
├── tsconfig.json
└── .env
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 🔌 API Endpoints

### Health Check
- `GET /health` - Check API health status

### Authentication (Coming Soon)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Requests (Coming Soon)
- `POST /api/v1/requests/execute` - Execute HTTP request
- `GET /api/v1/requests/:id` - Get request details
- `POST /api/v1/requests` - Create new request
- `PUT /api/v1/requests/:id` - Update request
- `DELETE /api/v1/requests/:id` - Delete request

### Collections (Coming Soon)
- `GET /api/v1/collections` - List collections
- `POST /api/v1/collections` - Create collection
- `GET /api/v1/collections/:id` - Get collection
- `PUT /api/v1/collections/:id` - Update collection
- `DELETE /api/v1/collections/:id` - Delete collection

### Environments (Coming Soon)
- `GET /api/v1/environments` - List environments
- `POST /api/v1/environments` - Create environment
- `GET /api/v1/environments/:id` - Get environment
- `PUT /api/v1/environments/:id` - Update environment
- `DELETE /api/v1/environments/:id` - Delete environment

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes by default)
- JWT authentication
- Password hashing with bcrypt
- Input validation with Zod

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🐛 Debugging

1. Check if databases are running:
   ```bash
   docker-compose ps
   ```

2. View logs:
   ```bash
   docker-compose logs postgres
   docker-compose logs mongodb
   ```

3. Check server logs in the terminal

## 📝 Next Steps

1. Implement authentication routes
2. Create request execution engine
3. Build collection management
4. Add environment variable support
5. Implement test script execution

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT
