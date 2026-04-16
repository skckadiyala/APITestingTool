# Changelog

All notable changes to Simba API Testing Tool will be documented here.

---

## [Version 1.0.0] - 2026-04-15

### 🎉 Initial Release

**Core Features:**
- ✅ Modern API testing interface
- ✅ REST API support (GET, POST, PUT, PATCH, DELETE)
- ✅ GraphQL API support with introspection
- ✅ WebSocket connections
- ✅ Request/Response history

**Authentication:**
- ✅ Bearer Token
- ✅ Basic Authentication
- ✅ API Key
- ✅ OAuth 2.0 (Authorization Code, Client Credentials)

**Advanced Features:**
- ✅ Pre-request scripts (JavaScript)
- ✅ Test scripts with Chai assertions
- ✅ Collection Runner
- ✅ Data-driven testing (CSV, JSON)
- ✅ Environment variables
- ✅ Collection/Global variables

**Collaboration:**
- ✅ Multi-workspace support
- ✅ Team sharing with role-based permissions
- ✅ Import/Export collections (Postman v2.1 format)
- ✅ Collection versioning

**Database:**
- ✅ Hybrid PostgreSQL + MongoDB architecture
- ✅ Optimized for large request/response storage

**Deployment:**
- ✅ Docker Compose setup
- ✅ PM2 production configuration
- ✅ Azure DevOps CI/CD integration

---

## Upcoming Features

### Version 1.1.0

**API Testing Enhancements:**
- 🔄 gRPC protocol support
- 🔄 SOAP/XML request builder
- 🔄 API mocking server
- 🔄 Request scheduling (cron jobs)

**Collaboration:**
- 🔄 Real-time collaboration (live cursor tracking)
- 🔄 Comment threads on requests
- 🔄 Collection change history/versioning
- 🔄 @mention team members in comments

**Performance:**
- 🔄 Load testing with multiple iterations
- 🔄 Performance metrics dashboard
- 🔄 Response time trends and alerts
- 🔄 API health monitoring

**Developer Experience:**
- 🔄 VS Code extension
- 🔄 CLI for headless testing
- 🔄 Postman/Insomnia auto-migration tool
- 🔄 OpenAPI/Swagger import

---

## Version History

### [Pre-release] - 2026-01-15

**Alpha Features:**
- Basic REST API support
- Collection management
- Environment variables
- PostgreSQL database

---

## Release Notes Format

Each release includes:

- 🎉 **New Features** - Added functionality
- ⚡ **Improvements** - Enhanced existing features
- 🐛 **Bug Fixes** - Resolved issues
- ⚠️ **Breaking Changes** - Backward-incompatible changes
- 🔧 **Maintenance** - Dependency updates, refactoring

---

## How to Update

### Docker Users
```bash
# Pull latest image
docker-compose pull

# Restart services
docker-compose down
docker-compose up -d
```

### Manual Installation
```bash
# Backend
cd backend
git pull
npm install
npm run build
pm2 restart backend

# Frontend
cd ../frontend
git pull
npm install
npm run build
pm2 restart frontend
```

---

## Migration Guides

For breaking changes, see detailed migration guides:
- [Migration from Postman](migration-postman.md)

---

## Feedback & Suggestions

We value your input! Submit feature requests:
- **GitHub Issues**: [Report bugs or request features](https://github.com/skckadiyala/APITestingTool/issues)
- **Email**: support@cdw.com
- **Discussions**: [Join the community](https://github.com/skckadiyala/APITestingTool/discussions)

---

## Stay Updated

- ⭐ Star us on [GitHub](https://github.com/skckadiyala/APITestingTool)
- 📧 Subscribe to release notifications
- 📣 Follow [@SimbaAPI](https://twitter.com/SimbaAPI) on Twitter

---

*Last updated: April 15, 2026*
