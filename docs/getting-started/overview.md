# What is Simba?

**Simba** is a modern, open-source API testing tool designed for developers and QA engineers. Built with React and Node.js, Simba provides a powerful yet intuitive interface for testing REST APIs, GraphQL endpoints, and WebSocket connections.

## Why Simba?

### 🎯 Purpose-Built for Modern APIs

Simba is designed from the ground up to handle modern API architectures:

- **REST API Testing** - Full HTTP method support with advanced request/response handling
- **GraphQL Support** - Native GraphQL with schema introspection and query validation
- **WebSocket Testing** - Real-time connection testing and message handling
- **Scripting & Automation** - JavaScript-based pre-request and test scripts

### 🚀 Key Features

#### Workspace-Based Organization
Organize your API testing projects into isolated **workspaces**, each with its own collections, environments, and team members.

#### Collection Management
Group related requests into **collections** and folders, making it easy to organize and run batch tests.

#### Environment Variables
Manage multiple environments (Dev, Staging, Production) with variable substitution using `{{variableName}}` syntax.

#### Pre-Request & Test Scripts
Write JavaScript code to:
- Set up authentication tokens
- Generate dynamic data
- Validate responses with assertions
- Chain requests together

#### Collection Runner
Execute entire collections or folders with:
- Sequential request execution
- Data-driven testing from CSV/JSON files
- Automated test reporting
- Detailed execution logs

#### Request History
Track every request execution with full request/response details for debugging and auditing.

#### Team Collaboration
Share workspaces with team members, control access permissions, and import/export collections.

## Simba vs. Postman

| Feature | Simba | Postman |
|---------|-------|---------|
| **Open Source** | ✅ Yes | ❌ No |
| **Self-Hosted** | ✅ Yes | ❌ Cloud only |
| **REST API** | ✅ Full support | ✅ Full support |
| **GraphQL** | ✅ Native support | ✅ Native support |
| **WebSocket** | ✅ Built-in | ⚠️ Via extensions |
| **Scripting** | ✅ JavaScript (pm API) | ✅ JavaScript (pm API) |
| **Collection Runner** | ✅ Yes | ✅ Yes |
| **Data-Driven Testing** | ✅ CSV/JSON | ✅ CSV/JSON |
| **Environments** | ✅ Unlimited | ⚠️ Limited on free tier |
| **Team Workspaces** | ✅ Unlimited | ⚠️ Limited on free tier |
| **Database** | 🔒 PostgreSQL + MongoDB | ☁️ Cloud-based |
| **Pricing** | 💰 Free (self-hosted) | 💰 Paid plans |

## Who Should Use Simba?

### Developers
- Test APIs during development
- Debug request/response issues
- Automate API testing with scripts
- Share collections with team members

### QA Engineers
- Validate API behavior across environments
- Run regression test suites
- Generate test reports for stakeholders
- Perform data-driven testing

### DevOps Teams
- Integrate with CI/CD pipelines
- Monitor API health in different environments
- Maintain API testing infrastructure
- Control sensitive data with self-hosting

### API Consumers
- Explore third-party APIs
- Test authentication flows
- Validate webhook endpoints
- Document API usage patterns

## How Simba Works

### 1. Create a Workspace
Workspaces are isolated containers for your API testing projects. Each workspace has its own collections, environments, and team members.

### 2. Organize Requests into Collections
Group related API requests into collections and folders. Collections can contain:
- Individual requests
- Nested folders
- Shared variables
- Pre-request and test scripts

### 3. Configure Environments
Define environment-specific variables (URLs, tokens, credentials) for Dev, Staging, and Production environments.

### 4. Build and Execute Requests
Use the request builder to:
- Set HTTP method and URL
- Add query parameters and headers
- Configure request body (JSON, form-data, raw)
- Set up authentication
- Write pre-request scripts
- Define test assertions

### 5. Validate Responses
View response details:
- Status code and time
- Response headers and cookies
- Body (formatted JSON, XML, HTML)
- Test results

### 6. Automate with Collection Runner
Run entire collections with:
- Sequential execution
- Data-driven iterations
- Test result aggregation
- Export reports

## Architecture

Simba uses a modern, dual-database architecture:

**Frontend** (React + TypeScript)
- Vite-based build system
- Zustand for state management
- Monaco Editor for code editing
- Tailwind CSS for styling

**Backend** (Node.js + Express + TypeScript)
- RESTful API architecture
- Prisma ORM for PostgreSQL (structured data)
- Mongoose ODM for MongoDB (flexible documents)
- JWT-based authentication
- Request execution engine with script sandboxing

**Databases**
- **PostgreSQL** - User accounts, workspaces, collections, request metadata
- **MongoDB** - Large request/response bodies, headers, scripts

This hybrid approach optimizes for both relational data integrity and flexible document storage.

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **RAM**: 4GB
- **Disk Space**: 1GB
- **Node.js**: 18+
- **Databases**: PostgreSQL 14+ and MongoDB 5+

### Recommended Requirements
- **RAM**: 8GB or more
- **Disk Space**: 5GB
- **Node.js**: 20 LTS
- **Databases**: PostgreSQL 16 and MongoDB 7

## Security & Privacy

### Self-Hosted Data
All your API requests, responses, and sensitive data stay on your infrastructure. No cloud sync, no third-party access.

### Authentication Options
Simba supports multiple authentication methods:
- Bearer Token
- Basic Auth
- API Key
- OAuth 2.0
- AWS Signature V4
- Digest Auth

### Script Sandboxing
Pre-request and test scripts run in a sandboxed JavaScript environment with limited access to system resources.

### Database Security
- Passwords hashed with bcrypt
- JWT tokens for session management
- Environment variables for sensitive configuration
- Database connection security with SSL/TLS support

## Getting Help

### Documentation
- **Getting Started**: Step-by-step tutorials
- **Core Concepts**: Understand workspaces, collections, and environments
- **Request Guides**: Detailed guides for REST, GraphQL, and WebSocket
- **API Reference**: Complete scripting API documentation

### Community & Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/skckadiyala/APITestingTool/issues)
- **Email Support**: support@cdw.com
- **Contributing**: See our [contribution guidelines](../about/contributing.md)

## License

Simba is open-source software licensed under the [MIT License](../about/license.md). You are free to use, modify, and distribute the software for commercial and non-commercial purposes.

## Next Steps

Ready to get started? Follow our guides:

<div class="grid cards" markdown>

-   :material-download:{ .lg .middle } **Install Simba**

    ---

    Set up Simba on your local machine or server

    [:octicons-arrow-right-24: Installation Guide](installation.md)

-   :material-rocket-launch:{ .lg .middle } **Quick Start**

    ---

    Create your first workspace and send a request in 5 minutes

    [:octicons-arrow-right-24: Quick Start](quick-start.md)

-   :material-api:{ .lg .middle } **First Request**

    ---

    Step-by-step tutorial to send your first API request

    [:octicons-arrow-right-24: Make Your First Request](first-request.md)

-   :material-book-open:{ .lg .middle } **Core Concepts**

    ---

    Understand workspaces, collections, and environments

    [:octicons-arrow-right-24: Learn Core Concepts](../concepts/workspaces.md)

</div>
