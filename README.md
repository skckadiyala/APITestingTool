# API Testing Tool

A modern, open-source API testing tool similar to Postman, built with React, TypeScript, Express.js, PostgreSQL, and MongoDB.

## ✨ Features

- 🚀 **HTTP Request Builder** - Send GET, POST, PUT, DELETE, PATCH and more
- 📁 **Collections Management** - Organize requests into collections and folders
- 🌍 **Environment Variables** - Manage variables across different environments
- 📊 **Test Data Files** - CSV/JSON support for data-driven testing
- 🔐 **Authentication** - Support for Bearer, Basic, OAuth, API Key, and more
- 📜 **Pre-request & Test Scripts** - JavaScript-based scripting with Chai assertions
- 📈 **Collection Runner** - Execute multiple requests with detailed reports
- 🎨 **Modern UI** - Clean, intuitive interface built with React and TailwindCSS
- 🌙 **Dark Mode** - Built-in dark mode support
- 📥 **Import/Export** - Compatible with Postman Collection format

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│       Frontend (React + TypeScript)      │
│  - Request Builder                       │
│  - Collections Manager                   │
│  - Environment Manager                   │
│  - Response Viewer                       │
└─────────────────────────────────────────┘
                   ↓ REST API
┌─────────────────────────────────────────┐
│    Backend (Express.js + TypeScript)    │
│  - Authentication                        │
│  - Request Execution                     │
│  - Collection Management                 │
│  - Script Execution                      │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│          Data Layer                      │
│  PostgreSQL (Metadata)                   │
│  MongoDB (Request/Response Bodies)       │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (recommended)
- Or PostgreSQL 14+ and MongoDB 6+ installed locally

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd api-testing-tool
```

### 2. Start Databases

```bash
docker-compose up -d
```

This will start PostgreSQL and MongoDB containers.

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend will run at `http://localhost:5000`

### 4. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Frontend will run at `http://localhost:5174`

### 5. Access the Application

Open your browser and navigate to `http://localhost:5174`

## 📁 Project Structure

```
api-testing-tool/
├── backend/                # Express.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── app.ts          # Express app setup
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # State management
│   │   ├── services/       # API services
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml      # Database services
├── PROJECT_PLAN.md         # Detailed project plan
├── IMPLEMENTATION_PROMPTS.md  # Phase-by-phase prompts
├── DESIGN_GUIDELINES.md    # Design system & patterns
└── README.md              # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client
- **Monaco Editor** - Code editor

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - PostgreSQL ORM
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Zod** - Validation

### Databases
- **PostgreSQL** - Relational data (users, collections, requests)
- **MongoDB** - Document storage (request/response bodies)

## 📖 Documentation

- [Project Plan](./PROJECT_PLAN.md) - Complete project overview and timeline
- [Implementation Prompts](./IMPLEMENTATION_PROMPTS.md) - Step-by-step implementation guide
- [Design Guidelines](./DESIGN_GUIDELINES.md) - Architecture and design patterns
- [Getting Started Guide](./GETTING_STARTED.md) - Quick start guide
- [Backend README](./backend/README.md) - Backend documentation
- [Frontend README](./frontend/README.md) - Frontend documentation

## 🗺️ Development Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Project structure setup
- [x] Database schema design
- [x] Basic Express server
- [ ] User authentication
- [ ] Dashboard layout

### Phase 2: Request Handling (Week 3-4)
- [ ] Request builder UI
- [ ] HTTP request execution
- [ ] Response viewer
- [ ] Request history

### Phase 3: Collections (Week 5-6)
- [ ] Collection CRUD operations
- [ ] Folder hierarchy
- [ ] Import/Export
- [ ] Collection runner

### Phase 4: Environments (Week 7-8)
- [ ] Environment management
- [ ] Variable substitution
- [ ] Multiple environments

### Phase 5: Advanced Features (Week 9-10)
- [ ] Authentication methods
- [ ] Pre-request scripts
- [ ] Test scripts
- [ ] Assertions

### Phase 6: Data Files (Week 11-12)
- [ ] CSV/JSON file upload
- [ ] Data-driven testing
- [ ] Test reports

### Phase 7: Polish (Week 13-14)
- [ ] Code generation
- [ ] Request chaining
- [ ] Documentation generator

### Phase 8: Production (Week 15-16)
- [ ] Testing & QA
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deployment

## 🧪 Testing

### Backend
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend
```bash
cd frontend
npm test
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- SQL/NoSQL injection prevention
- XSS protection

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Scripts

### Backend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run prisma:migrate  # Run database migrations
npm test             # Run tests
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

### Docker Commands
```bash
docker-compose up -d              # Start databases
docker-compose down               # Stop databases
docker-compose logs postgres      # View PostgreSQL logs
docker-compose logs mongodb       # View MongoDB logs
docker-compose ps                 # Check status
```

## 🐛 Troubleshooting

### Databases not connecting?
```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs

# Restart containers
docker-compose restart
```

### Port already in use?
- Backend default: 5000
- Frontend default: 5174
- PostgreSQL: 5432
- MongoDB: 27017

Change ports in `.env` files if needed.

### Prisma migration issues?
```bash
cd backend
npm run prisma:migrate reset
npm run prisma:migrate
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [Postman](https://www.postman.com/)
- Built with modern web technologies
- Open source community

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Happy API Testing!** 🚀
