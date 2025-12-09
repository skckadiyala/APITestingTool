# Implementation Prompts - Phase by Phase

This document contains detailed prompts for each phase of development. Use these prompts with your AI assistant or as a checklist for implementation.

---

## 🔵 Phase 1: Foundation & Core Setup

### Prompt 1.1: Project Initialization

```
Create a full-stack API testing tool project structure with:
- Backend: Express.js with TypeScript in /backend directory
- Frontend: React 18 with TypeScript in /frontend directory
- Database: Docker Compose file with PostgreSQL and MongoDB
- Development setup: ESLint, Prettier, Husky pre-commit hooks

Include:
- package.json for both frontend and backend
- TypeScript configurations (tsconfig.json)
- Environment variable templates (.env.example)
- README with setup instructions
- .gitignore files
- Docker Compose configuration

Backend should use:
- Express.js with TypeScript
- Prisma for PostgreSQL
- Mongoose for MongoDB
- JWT for authentication
- bcrypt for password hashing
- dotenv for environment variables

Frontend should use:
- React 18 with TypeScript
- Vite as build tool
- TailwindCSS for styling
- React Router for routing
- Axios for HTTP requests
- Zustand for state management
```

### Prompt 1.2: Database Schema Implementation

```
Implement the database schema for the API testing tool:

PostgreSQL schema using Prisma:
1. Users table with authentication fields
2. Workspaces table for organizing collections
3. Collections table supporting hierarchical folder structure
4. Requests table for storing request metadata
5. Environments table for environment variables
6. RequestHistory table for tracking execution history

MongoDB schema using Mongoose:
1. RequestBodies collection for storing request configurations
2. ResponseBodies collection for storing response data

Add proper relationships, indexes, and constraints.
Include Prisma migration files and Mongoose models.
Add seed data for development.
```

### Prompt 1.3: Authentication System

```
Implement a complete authentication system:

Backend:
1. User registration endpoint with email validation
2. Login endpoint with JWT token generation
3. Password hashing using bcrypt
4. JWT middleware for protected routes
5. Refresh token mechanism
6. Password reset functionality (email-based)
7. User profile endpoints (GET, PUT)

Frontend:
1. Login page with form validation
2. Registration page
3. Protected route wrapper component
4. Auth context/store for managing auth state
5. Token refresh logic with Axios interceptors
6. Logout functionality
7. "Forgot Password" flow

Include proper error handling and validation.
```

### Prompt 1.4: Basic Dashboard Layout

```
Create the main application layout with:

Components:
1. TopNavbar: Logo, workspace selector, user menu, settings
2. Sidebar: Collections tree, environment selector, history
3. MainContent: Request builder area
4. BottomPanel: Console/logs (collapsible)

Features:
- Responsive design (mobile-friendly)
- Collapsible sidebar
- Resizable panels
- Dark mode toggle
- Keyboard shortcuts (Cmd+K for command palette)

Use TailwindCSS for styling and implement with React components.
Include loading states and error boundaries.
```

---

## 🟢 Phase 2: Basic Request Handling

### Prompt 2.1: Request Builder UI

```
Create a comprehensive request builder interface:

Components:
1. URLBar component:
   - Method dropdown (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
   - URL input with autocomplete from history
   - Send button with loading state
   - Save button

2. RequestTabs component with tabs:
   - Params: Key-value editor for query parameters
   - Headers: Key-value editor with autocomplete (common headers)
   - Body: Type selector (JSON, Form-data, XML, Raw, Binary)
   - Auth: Authentication type selector
   - Pre-request Script: Code editor
   - Tests: Code editor

3. KeyValueEditor component:
   - Reusable component for params, headers, form-data
   - Add/remove rows
   - Bulk edit mode
   - Enable/disable individual items

4. BodyEditor component:
   - JSON editor with Monaco Editor (syntax highlighting, validation)
   - Form-data builder with file upload
   - Raw text editor
   - XML editor

Include validation, auto-formatting, and error handling.
```

### Prompt 2.2: HTTP Request Execution Engine

```
Implement the request execution engine:

Backend API:
1. POST /api/requests/execute endpoint
2. Parse request configuration (headers, body, auth)
3. Handle different auth types (Bearer, Basic, API Key)
4. Make HTTP request using axios or node-fetch
5. Capture response (status, headers, body, timing)
6. Store in request history
7. Return response to frontend

Features:
- Support all HTTP methods
- Handle redirects
- Cookie management
- SSL certificate handling
- Proxy support
- Timeout configuration
- Response size limits

Frontend:
- Send request on button click
- Show loading state with progress indicator
- Handle errors gracefully
- Display success/error notifications
```

### Prompt 2.3: Response Viewer

```
Create a comprehensive response viewer:

Components:
1. ResponseStatusBar:
   - Status code with color coding (green 2xx, yellow 3xx, red 4xx/5xx)
   - Response time
   - Response size
   - Status text

2. ResponseTabs:
   - Body tab:
     * Pretty JSON viewer with syntax highlighting
     * Raw view
     * Preview (for HTML responses)
     * Search within response
   - Headers tab:
     * Display response headers
     * Copy functionality
   - Cookies tab:
     * Display cookies
     * Cookie details
   - Test Results tab:
     * Show passed/failed assertions
     * Test execution logs

3. ResponseBody viewer:
   - Auto-detect content type
   - JSON pretty print with collapsible sections
   - XML formatting
   - HTML preview
   - Image preview
   - Copy to clipboard
   - Download response

Make it responsive and handle large responses efficiently.
```

### Prompt 2.4: Request History

```
Implement request history tracking:

Backend:
1. Save each request execution to request_history table
2. Store request snapshot (URL, method, headers, body reference)
3. Store response snapshot (status, headers, body reference)
4. Track execution timestamp and response time
5. GET /api/history endpoint with pagination and filtering
6. DELETE /api/history/:id endpoint

Frontend:
1. History sidebar panel
2. List view with:
   - Method badge
   - URL (truncated)
   - Status code
   - Timestamp (relative time)
   - Response time
3. Search and filter:
   - By method
   - By status code range
   - By date range
   - By URL pattern
4. Click to restore request
5. Clear history button
6. Export history as JSON

Include infinite scroll or pagination for performance.
```

---

## 🟡 Phase 3: Collections Management

### Prompt 3.1: Collection Data Structure & API

```
Implement collections management system:

Backend API:
1. POST /api/collections - Create collection
2. GET /api/collections - List all collections in workspace
3. GET /api/collections/:id - Get collection with requests
4. PUT /api/collections/:id - Update collection
5. DELETE /api/collections/:id - Delete collection
6. POST /api/collections/:id/folders - Create folder in collection
7. POST /api/collections/:id/requests - Add request to collection
8. PUT /api/requests/:id/move - Move request to different folder
9. PUT /api/collections/:id/reorder - Reorder items

Features:
- Hierarchical folder structure (unlimited nesting)
- Drag-and-drop ordering
- Duplicate collection
- Share collection (generate shareable link)

Database:
- Use self-referencing foreign key for folder hierarchy
- Store order index for custom sorting
```

### Prompt 3.2: Collections Sidebar UI

```
Create an interactive collections sidebar:

Components:
1. CollectionTree:
   - Hierarchical tree view
   - Expand/collapse folders
   - Icons for collections, folders, requests
   - Method badges on requests
   - Context menu (right-click)

2. TreeNode component:
   - Drag-and-drop support (react-dnd or dnd-kit)
   - Hover actions (add, edit, delete)
   - Inline rename
   - Loading states

3. Context Menu:
   - Add Request
   - Add Folder
   - Rename
   - Duplicate
   - Delete
   - Export
   - Run Collection

4. Search bar:
   - Search within collections
   - Filter by method
   - Highlight matches

Interactions:
- Click to open request
- Drag to reorder/move
- Double-click to rename
- Keyboard navigation (arrows, enter, escape)
```

### Prompt 3.3: Import/Export Functionality

```
Implement import and export for collections:

Export functionality:
1. Export as JSON (Postman v2.1 format compatible)
2. Export as cURL commands
3. Export as OpenAPI 3.0 specification
4. ZIP export with all files

Frontend:
- Export button in collection menu
- Format selector dialog
- Download file automatically
- Include environment variables option

Import functionality:
1. Parse Postman Collection v2.1 format
2. Parse OpenAPI 3.0 specifications
3. Parse Insomnia collections
4. Import cURL commands (single or bulk)

Frontend:
- File upload drag-and-drop area
- Format auto-detection
- Preview imported structure before confirming
- Conflict resolution (merge or replace)
- Progress indicator for large imports

Backend:
- POST /api/collections/import endpoint
- File parsing and validation
- Create collections, folders, requests in database
- Return created collection IDs
```

### Prompt 3.4: Collection Runner

```
Implement collection runner for executing multiple requests:

Backend:
1. POST /api/collections/:id/run endpoint
2. Execute all requests in order
3. Support folder selection (run specific folder)
4. Variable persistence across requests
5. Pre-request and test script execution
6. Stop on error option
7. Delay between requests
8. Iteration support

Frontend:
1. Collection Runner dialog:
   - Select collection or folder
   - Environment selector
   - Iteration count
   - Delay (ms) between requests
   - Stop on error toggle
   - Data file upload (CSV/JSON)

2. Runner Results view:
   - Request list with pass/fail status
   - Execution timeline
   - Overall statistics (total, passed, failed)
   - Individual request details
   - Export results as HTML/JSON
   - View failed request details
   - Retry failed requests

Real-time updates:
- WebSocket connection for live progress
- Cancelable execution
- Pause/resume functionality
```

---

## 🟣 Phase 4: Environment Variables

### Prompt 4.1: Environment Management

```
Implement environment variable system:

Backend API:
1. POST /api/environments - Create environment
2. GET /api/environments - List environments in workspace
3. GET /api/environments/:id - Get environment with variables
4. PUT /api/environments/:id - Update environment
5. DELETE /api/environments/:id - Delete environment
6. POST /api/environments/:id/duplicate - Duplicate environment

Data structure:
- Environment name
- Array of variables: [{key, value, type, enabled, description}]
- Variable types: default, secret
- Initial value and current value

Features:
- Multiple environments (dev, staging, prod)
- Secret variables (masked in UI)
- Global variables (workspace-level)
- Collection-level variables
- Local variables (session-only)
```

### Prompt 4.2: Environment UI & Editor

```
Create environment management interface:

Components:
1. EnvironmentSelector dropdown:
   - List all environments
   - Show active environment
   - "No Environment" option
   - Quick switch
   - Manage environments button

2. EnvironmentEditor modal:
   - Environment name input
   - Variable table:
     * Key column
     * Type column (default/secret)
     * Initial value column
     * Current value column
     * Description column
     * Enable/disable toggle
   - Add variable button
   - Bulk edit mode
   - Import variables from JSON/ENV file
   - Export environment

3. GlobalVariables panel:
   - Similar to environment editor
   - Accessible from workspace settings
   - Lower precedence than environment variables

Features:
- Variable autocomplete in request fields
- Syntax: {{variable_name}}
- Visual highlighting of variables
- Hover to see variable value
- Click to edit variable
```

### Prompt 4.3: Variable Resolution Engine

```
Implement variable substitution system:

Backend:
1. Variable resolution order:
   - Local (session)
   - Collection variables
   - Environment variables
   - Global variables

2. Built-in dynamic variables:
   - {{$timestamp}} - Current Unix timestamp
   - {{$isoTimestamp}} - ISO 8601 timestamp
   - {{$randomInt}} - Random integer (0-1000)
   - {{$randomUUID}} - Random UUID v4
   - {{$randomEmail}} - Random email
   - {{$randomFirstName}} - Random first name
   - {{$randomLastName}} - Random last name

3. Variable substitution in:
   - URL
   - Query parameters
   - Headers
   - Request body
   - Pre-request scripts
   - Test scripts

4. Recursive resolution (variables within variables)
5. Escape syntax for literal {{}} text

Frontend:
- Variable highlighting in code editors
- Autocomplete suggestions
- Validation warnings for undefined variables
- Variable preview tooltip
```

### Prompt 4.4: Variable Extraction from Responses

```
Implement dynamic variable extraction:

Features:
1. Extract from JSON response using JSON path
2. Extract from headers
3. Extract from cookies
4. Extract using regex patterns
5. Set as environment or collection variable

Test script API:
```javascript
// Set environment variable
pm.environment.set("token", pm.response.json().token);

// Set collection variable
pm.collectionVariables.set("userId", pm.response.json().user.id);

// Set global variable
pm.globals.set("apiUrl", "https://api.example.com");

// Get variable
const token = pm.environment.get("token");

// Unset variable
pm.environment.unset("token");
```

Frontend:
- Variable extraction UI in response viewer
- Point-and-click to extract JSON values
- Save to environment dialog
- Visual indicators for auto-captured variables
```

---

## 🔴 Phase 5: Advanced Features

### Prompt 5.1: Authentication Methods

```
Implement comprehensive authentication support:

Auth types:
1. No Auth
2. Bearer Token
   - Token input field
   - Token prefix option
3. Basic Auth
   - Username and password fields
   - Auto-encode to Base64
4. API Key
   - Key name, value, add to (Header/Query params)
5. OAuth 2.0
   - Grant types: Authorization Code, Client Credentials, Password
   - Access token URL
   - Authorization URL
   - Client ID and Secret
   - Scope
   - Token auto-refresh
6. OAuth 1.0
   - Consumer key and secret
   - Token and token secret
   - Signature method
7. Digest Auth
8. AWS Signature
   - Access Key and Secret Key
   - Region and service
   - Session token

Frontend:
- Auth tab in request builder
- Auth type selector
- Conditional form fields based on auth type
- Inherit from collection option
- Token helper (decode JWT, check expiry)

Backend:
- Generate appropriate auth headers
- OAuth flow handler endpoints
- Secure credential storage
- Token refresh logic
```

### Prompt 5.2: Script Editor with Monaco

```
Implement code editor for pre-request and test scripts:

Frontend:
1. Integrate Monaco Editor (VS Code editor)
2. JavaScript syntax highlighting
3. Autocomplete for pm API
4. IntelliSense with documentation
5. Error highlighting
6. Multi-line editing
7. Snippets library:
   - Common test assertions
   - Variable operations
   - Response parsing
   - Environment switching

Features:
- Fullscreen mode
- Console logs display
- Script execution errors
- Execution time
- Variable watch panel

pm API objects:
- pm.request (method, url, headers, body)
- pm.response (status, headers, body, json(), text())
- pm.environment (get, set, unset)
- pm.collectionVariables
- pm.globals
- pm.test(name, function)
- pm.expect (Chai assertion)
- pm.sendRequest (send follow-up requests)
```

### Prompt 5.3: Test Script Engine

```
Implement JavaScript test execution engine:

Backend:
1. Sandboxed JavaScript execution (use vm2 or isolated-vm)
2. Provide pm object with API methods
3. Chai assertion library integration
4. Console.log capture
5. Timeout handling (default 5s)
6. Error handling and stack traces

pm.test() examples:
```javascript
// Status code tests
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Response time test
pm.test("Response time is less than 200ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(200);
});

// JSON response tests
pm.test("Response has correct structure", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("users");
  pm.expect(jsonData.users).to.be.an("array");
  pm.expect(jsonData.users[0]).to.have.property("email");
});

// Header tests
pm.test("Content-Type is JSON", function () {
  pm.response.to.have.header("Content-Type", "application/json");
});

// Set variable from response
pm.test("Extract user ID", function () {
  const jsonData = pm.response.json();
  pm.environment.set("userId", jsonData.user.id);
});
```

Frontend:
- Display test results in dedicated tab
- Pass/fail status for each test
- Execution logs
- Failed assertion details
- Rerun tests button
```

### Prompt 5.4: Pre-request Scripts

```
Implement pre-request script functionality:

Features:
1. Execute JavaScript before sending request
2. Modify request dynamically:
   - Set/modify headers
   - Set/modify body
   - Set/modify URL params
   - Set variables
3. Perform calculations
4. Generate dynamic data
5. Load external data

Examples:
```javascript
// Set timestamp in header
pm.request.headers.add({
  key: "X-Timestamp",
  value: Date.now().toString()
});

// Generate HMAC signature
const crypto = require("crypto-js");
const message = pm.request.url.toString();
const secret = pm.environment.get("api_secret");
const signature = crypto.HmacSHA256(message, secret).toString();
pm.request.headers.add({
  key: "X-Signature",
  value: signature
});

// Set dynamic body
pm.request.body.update({
  timestamp: new Date().toISOString(),
  requestId: pm.variables.replaceIn("{{$randomUUID}}")
});

// Conditional logic
if (pm.environment.get("env") === "production") {
  pm.request.url.host = "api.prod.example.com";
} else {
  pm.request.url.host = "api.dev.example.com";
}
```

Backend:
- Execute pre-request script before making HTTP request
- Apply modifications to request
- Handle errors gracefully
- Log execution results
```

---

## 🟠 Phase 6: Data Files & Batch Testing

### Prompt 6.1: Data File Support

```
Implement data file functionality for data-driven testing:

File formats:
1. CSV files
2. JSON files (array of objects)

Backend API:
1. POST /api/data-files/upload - Upload data file
2. GET /api/data-files/:id - Get parsed data
3. DELETE /api/data-files/:id - Delete data file
4. POST /api/collections/:id/run-with-data - Run with data file

Features:
- Parse CSV with headers as variable names
- Parse JSON arrays
- Validate file format and structure
- Preview first 10 rows
- Variable mapping interface
- File size limits (10MB max)

Example CSV:
```csv
username,password,expectedStatus
user1,pass123,200
user2,wrongpass,401
admin,admin123,200
```

Example JSON:
```json
[
  {"username": "user1", "password": "pass123", "expectedStatus": 200},
  {"username": "user2", "password": "wrongpass", "expectedStatus": 401}
]
```

Frontend:
- File upload drag-and-drop
- Data preview table
- Column/variable mapping
- Iteration options
```

### Prompt 6.2: Data-Driven Collection Runner

```
Enhance collection runner with data file support:

Features:
1. Upload data file (CSV/JSON)
2. Map columns to variables
3. Run collection for each data row
4. Variable substitution from data row
5. Parallel or sequential execution
6. Stop on first failure option
7. Export results per iteration

Frontend UI:
1. Data file section in runner dialog:
   - Upload button
   - File preview
   - Variable mapping table
   - Iteration count display

2. Results view enhancements:
   - Group by iteration
   - Show data row for each iteration
   - Filter by pass/fail
   - Export detailed report

3. Results table:
   | Iteration | Data | Status | Passed | Failed | Time |
   |-----------|------|--------|--------|--------|------|
   | 1 | user1... | ✅ | 5 | 0 | 1.2s |
   | 2 | user2... | ❌ | 3 | 2 | 0.8s |

Backend:
- Load data file
- Create iteration context for each row
- Inject variables into execution context
- Aggregate results
- Generate comprehensive report
```

### Prompt 6.3: Batch Request Execution

```
Implement batch execution capabilities:

Features:
1. Select multiple requests from different collections
2. Execute in specified order or parallel
3. Share variables across requests
4. Conditional execution based on previous responses
5. Retry logic for failed requests
6. Rate limiting options

Frontend:
1. Multi-select checkboxes in collections sidebar
2. Batch actions toolbar:
   - Run selected
   - Delete selected
   - Move selected
   - Export selected
3. Execution queue view
4. Live progress indicator
5. Results summary

Backend:
- Queue management system
- Parallel execution with concurrency limits
- Dependency resolution
- Rollback on failure option
```

### Prompt 6.4: Test Report Generation

```
Create comprehensive test reporting:

Report formats:
1. HTML report (styled, interactive)
2. JSON report (machine-readable)
3. CSV export (for analysis)
4. PDF report (for sharing)

Report contents:
1. Executive summary:
   - Total requests
   - Pass/fail counts
   - Success rate percentage
   - Total execution time
   - Average response time
2. Request details:
   - Request name and method
   - Status code
   - Response time
   - Test results
   - Assertions passed/failed
3. Charts and graphs:
   - Response time distribution
   - Status code distribution
   - Pass/fail pie chart
   - Timeline chart
4. Failed request details:
   - Request configuration
   - Response data
   - Error messages
   - Screenshots (if UI testing)

Frontend:
- Report viewer component
- Export options menu
- Share report functionality
- Schedule periodic reports (future feature)

Backend:
- Report generation service
- Template rendering (Handlebars or EJS)
- Chart generation (Chart.js data)
- PDF generation (Puppeteer or PDFKit)
```

---

## 🟤 Phase 7: Polish & Advanced Features

### Prompt 7.1: Code Generation

```
Implement code snippet generation from requests:

Languages to support:
1. cURL
2. JavaScript (fetch, axios, jQuery)
3. Python (requests, http.client)
4. Node.js (native http, axios, node-fetch)
5. Go (net/http)
6. Java (HttpClient, OkHttp)
7. PHP (cURL, Guzzle)
8. Ruby (net/http, HTTParty)
9. C# (HttpClient, RestSharp)
10. Swift (URLSession)

Features:
- Generate from current request configuration
- Include headers, body, auth
- Use environment variables
- Copy to clipboard button
- Syntax highlighting
- Download as file

Frontend:
1. Code tab in request builder
2. Language selector dropdown
3. Library selector (where applicable)
4. Code editor with syntax highlighting
5. Copy button
6. Settings for code style (tabs/spaces, etc.)

Backend:
- Code generation templates
- Variable substitution
- Proper escaping and formatting
- Support different auth methods
```

### Prompt 7.2: Request Chaining & Workflows

```
Implement request chaining for complex workflows:

Features:
1. Visual workflow builder
2. Drag-and-drop request nodes
3. Connect requests with arrows
4. Conditional branching (if/else)
5. Loop nodes (for iterations)
6. Delay nodes
7. Variable passing between requests
8. Error handling branches

Workflow nodes:
- Request node (execute request)
- Condition node (if response.status === 200)
- Loop node (repeat N times or foreach data)
- Delay node (wait X milliseconds)
- Variable node (set/transform variables)
- Script node (custom JavaScript)

Frontend:
1. Workflow canvas (React Flow or similar)
2. Node palette
3. Connection lines with labels
4. Node configuration panels
5. Workflow execution visualizer
6. Save/load workflows

Backend:
- Workflow execution engine
- Node processor for each type
- State management between nodes
- Error propagation
- Execution history per workflow
```

### Prompt 7.3: Response Caching & Mock Server

```
Implement response caching and mock server:

Response Caching:
1. Cache responses by request signature
2. TTL (time-to-live) configuration
3. Cache invalidation
4. Cache hit/miss indicators
5. View cached responses
6. Export cache

Mock Server:
1. Create mock endpoints from collections
2. Define mock responses
3. Response templating (dynamic data)
4. Delay simulation
5. Error response simulation
6. Start/stop mock server
7. Mock server URL

Frontend:
1. Cache settings in preferences
2. Cache viewer panel
3. Mock server tab in collection
4. Mock response editor
5. Mock server control (start/stop)
6. Mock server URL display

Backend:
- In-memory cache (Redis optional)
- Cache middleware
- Mock server with Express routes
- Dynamic route generation from collections
- Response template engine
```

### Prompt 7.4: API Documentation Generator

```
Generate API documentation from collections:

Features:
1. Auto-generate docs from collections
2. Markdown format
3. HTML format (styled, responsive)
4. OpenAPI/Swagger specification
5. Include request examples
6. Include response examples
7. Authentication documentation
8. Environment setup instructions

Documentation includes:
1. Table of contents
2. Base URL and authentication
3. For each endpoint:
   - Method and URL
   - Description
   - Parameters (query, path, header, body)
   - Request examples
   - Response schema
   - Status codes
   - Example responses
   - Test examples

Frontend:
1. "Generate Docs" button in collection menu
2. Documentation preview
3. Format selector
4. Customization options:
   - Theme selection
   - Logo upload
   - Include/exclude sections
5. Publish to hosted URL option
6. Download as file

Backend:
- Documentation generator service
- Template rendering
- OpenAPI spec generation
- Hosted docs with public URLs
- Version management
```

---

## ⚫ Phase 8: Testing, Optimization & Deployment

### Prompt 8.1: Unit & Integration Testing

```
Implement comprehensive test coverage:

Frontend Testing:
1. Component tests (React Testing Library)
   - Request builder components
   - Collection tree
   - Environment editor
   - Response viewer
2. Hook tests
   - Custom hooks (useRequest, useCollection, etc.)
3. Integration tests
   - User flows (create request, save to collection, execute)
4. Snapshot tests for UI components

Backend Testing:
1. Unit tests for services
   - AuthService
   - RequestService
   - CollectionService
   - VariableResolver
2. API endpoint tests (Supertest)
   - All CRUD operations
   - Authentication flows
   - Error handling
3. Database tests
   - Repository layer
   - Migrations

E2E Testing:
1. Playwright or Cypress tests
2. Critical user journeys:
   - User registration and login
   - Create and execute request
   - Create collection and organize requests
   - Run collection with environment
   - Import/export collections

Test files structure:
```
backend/
  src/
    __tests__/
      unit/
      integration/
frontend/
  src/
    __tests__/
      components/
      hooks/
      integration/
e2e/
  tests/
```

Target: 80%+ code coverage
```

### Prompt 8.2: Performance Optimization

```
Optimize application performance:

Frontend optimizations:
1. Code splitting (React.lazy, Suspense)
2. Memoization (React.memo, useMemo, useCallback)
3. Virtual scrolling for large lists (react-window)
4. Debounce search inputs
5. Lazy load Monaco Editor
6. Optimize bundle size (analyze with webpack-bundle-analyzer)
7. Image optimization
8. Service Worker for offline support
9. Efficient state management (avoid unnecessary re-renders)

Backend optimizations:
1. Database query optimization:
   - Add indexes on frequently queried fields
   - Use EXPLAIN ANALYZE to find slow queries
   - Implement query result caching
2. API response pagination
3. Implement rate limiting (express-rate-limit)
4. Response compression (gzip)
5. Connection pooling for databases
6. Implement Redis caching for frequent reads
7. Background job processing (Bull/BullMQ)
8. Load balancing configuration

Performance monitoring:
- Lighthouse scores > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- API response times < 200ms (p95)
```

### Prompt 8.3: Security Audit & Hardening

```
Perform security audit and implement hardening:

Security checklist:
1. Authentication & Authorization:
   ✓ JWT tokens with expiry
   ✓ Refresh token rotation
   ✓ Password strength requirements
   ✓ Rate limiting on auth endpoints
   ✓ Account lockout after failed attempts
   ✓ Secure password reset flow

2. Input Validation:
   ✓ Validate all user inputs
   ✓ Sanitize HTML/JavaScript
   ✓ SQL injection prevention (parameterized queries)
   ✓ NoSQL injection prevention
   ✓ XSS protection
   ✓ CSRF tokens for state-changing operations

3. Data Protection:
   ✓ HTTPS only in production
   ✓ Secure cookie flags (HttpOnly, Secure, SameSite)
   ✓ Encrypt sensitive data at rest
   ✓ Environment variables for secrets
   ✓ No sensitive data in logs
   ✓ Secret management (HashiCorp Vault or AWS Secrets Manager)

4. API Security:
   ✓ CORS configuration
   ✓ Rate limiting per user/IP
   ✓ API versioning
   ✓ Content Security Policy headers
   ✓ Request size limits
   ✓ Timeout configuration

5. Dependencies:
   ✓ Regular npm audit
   ✓ Dependabot enabled
   ✓ No known vulnerabilities
   ✓ License compliance

6. Monitoring:
   ✓ Error tracking (Sentry)
   ✓ Audit logs for sensitive operations
   ✓ Anomaly detection

Run security tools:
- npm audit / yarn audit
- OWASP ZAP scan
- Snyk security scan
- SonarQube analysis
```

### Prompt 8.4: Production Deployment

```
Prepare and deploy to production:

Infrastructure:
1. Docker containerization:
   - Multi-stage builds
   - Optimize image size
   - Health check endpoints
   - docker-compose for local development

2. Orchestration options:
   - Kubernetes (for scalability)
   - Docker Swarm
   - AWS ECS
   - Cloud-native deployment (Vercel/Netlify for frontend)

3. Database:
   - Managed PostgreSQL (AWS RDS, Google Cloud SQL)
   - Managed MongoDB (Atlas)
   - Automated backups
   - Replication and failover

4. CI/CD Pipeline (GitHub Actions):
   - Run tests on PR
   - Security scan
   - Build Docker images
   - Deploy to staging on merge to develop
   - Deploy to production on merge to main
   - Rollback capability

5. Monitoring & Logging:
   - Application monitoring (New Relic, Datadog)
   - Log aggregation (ELK stack, CloudWatch)
   - Uptime monitoring (Pingdom, UptimeRobot)
   - Performance monitoring (Prometheus + Grafana)
   - Error tracking (Sentry)

6. Domain & SSL:
   - Domain setup
   - SSL certificate (Let's Encrypt)
   - CDN setup (CloudFlare)

Deployment checklist:
✓ Environment variables configured
✓ Database migrations run
✓ Health check endpoint working
✓ Logging configured
✓ Monitoring setup
✓ Backup strategy in place
✓ Rollback plan documented
✓ Load testing completed
✓ Security scan passed
✓ Documentation updated

Post-deployment:
- Monitor error rates
- Check performance metrics
- Verify all features working
- Announce to users
```

---

## 📚 Additional Implementation Prompts

### Bonus: Keyboard Shortcuts

```
Implement keyboard shortcuts for power users:

Shortcuts:
- Cmd/Ctrl + Enter: Send request
- Cmd/Ctrl + S: Save request
- Cmd/Ctrl + K: Command palette
- Cmd/Ctrl + E: Focus environment selector
- Cmd/Ctrl + /: Toggle sidebar
- Cmd/Ctrl + Shift + F: Format JSON
- Cmd/Ctrl + D: Duplicate request
- Cmd/Ctrl + F: Search in collections
- Escape: Close modals/dialogs
- Arrow keys: Navigate collection tree

Implementation:
- Use a keyboard shortcut library (react-hotkeys-hook)
- Show shortcuts in tooltips
- Keyboard shortcuts help modal (?)
- Customizable shortcuts in settings
```

### Bonus: Collaboration Features

```
Add collaboration capabilities (future enhancement):

Features:
1. Team workspaces
2. Real-time collaboration (multiple users editing)
3. Comments on requests
4. Version history
5. Change tracking
6. User permissions (admin, editor, viewer)
7. Share collections with team members
8. Activity feed
9. @mentions in comments
10. Request approval workflow

Technology:
- WebSocket for real-time updates
- Operational transformation for concurrent editing
- Role-based access control (RBAC)
```

### Bonus: Integrations

```
Implement third-party integrations:

Integrations:
1. CI/CD integration:
   - Jenkins plugin
   - GitHub Actions
   - GitLab CI
   - CircleCI

2. Version control:
   - Sync collections to Git
   - Pull requests for changes
   - Branch per environment

3. Documentation:
   - Confluence export
   - Swagger/OpenAPI sync

4. Monitoring:
   - New Relic integration
   - Datadog APM

5. Import from:
   - Postman
   - Insomnia
   - Swagger/OpenAPI
   - HAR files
   - cURL commands

6. Export to:
   - OpenAPI specs
   - Markdown docs
   - Code snippets
```

---

## 🎯 Summary

These prompts are designed to be used iteratively. Start with Phase 1 and work your way through each phase systematically. Each prompt can be given to an AI coding assistant (like GitHub Copilot, ChatGPT, or Claude) to generate the implementation code.

**Tips for using these prompts:**
1. Provide relevant context from your existing codebase
2. Break down complex prompts into smaller sub-tasks if needed
3. Review generated code before committing
4. Test each feature as you implement it
5. Iterate and refine based on user feedback

**Next Steps:**
Ready to start implementation? Begin with **Prompt 1.1: Project Initialization** and work through the phases sequentially.

Good luck building your API testing tool! 🚀
