# Copilot Instructions for API Testing Tool

A modern API testing tool similar to Postman, built with React + TypeScript (frontend) and Express.js + TypeScript (backend).

## Build, Test, and Lint Commands

### Backend (`/backend`)

```bash
# Development
npm run dev                  # Start dev server with nodemon

# Build & Production
npm run build                # Compile TypeScript
npm start                    # Run production build

# Database
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate       # Run database migrations
npm run prisma:studio        # Open Prisma Studio (DB GUI)
npm run prisma:seed          # Seed PostgreSQL with test data
npm run seed:mongo           # Seed MongoDB with test data
npm run seed:all             # Seed both databases

# Testing
npm test                     # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage

# Linting & Formatting
npm run lint                 # ESLint check
npm run format               # Format with Prettier
```

### Frontend (`/frontend`)

```bash
# Development
npm run dev                  # Start Vite dev server (port 5174)

# Build & Production
npm run build                # Build for production
npm run preview              # Preview production build

# Testing
npm test                     # Run Vitest tests
npm run test:ui              # Run Vitest with UI
npm run test:coverage        # Run tests with coverage

# Linting
npm run lint                 # ESLint check
```

### Docker & Infrastructure

```bash
# Docker Compose (PostgreSQL + MongoDB)
docker-compose up -d         # Start databases
docker-compose down          # Stop databases
docker-compose logs postgres # View PostgreSQL logs
docker-compose logs mongodb  # View MongoDB logs

# PM2 Production (Windows/Linux)
pm2 start ecosystem.config.js    # Start both backend & frontend
pm2 logs                         # View logs
pm2 restart all                  # Restart all services
```

## Architecture Overview

### Hybrid Database Strategy

The application uses **two databases** for optimal performance:

1. **PostgreSQL** (via Prisma ORM):
   - Stores structured relational data
   - Tables: Users, Workspaces, Collections, Requests, Environments, RequestHistory
   - Handles user authentication, workspace management, collection metadata

2. **MongoDB** (via Mongoose ODM):
   - Stores flexible document data
   - Collections: RequestBody, ResponseBody
   - Handles large request/response payloads, headers, scripts

**Why this matters**: When working with requests:
- Request metadata (name, URL, method) → PostgreSQL `Request` table
- Request details (headers, body, scripts) → MongoDB `RequestBody` document
- These are linked by `requestId` which references the PostgreSQL request

### Request Execution Flow

```
Frontend Request → Backend API → RequestExecutor Service
                                      ↓
                    1. Resolve environment variables
                    2. Execute pre-request scripts
                    3. Apply authentication
                    4. Send HTTP/GraphQL request
                    5. Execute test scripts
                    6. Store in history
                                      ↓
                    Return ExecutionResult with response data
```

**Key Services**:
- `RequestExecutor.ts` - Main HTTP request execution engine
- `GraphQLExecutor.ts` - GraphQL request handler (introspection, queries, mutations)
- `TestScriptEngine.ts` - Runs JavaScript test scripts with Chai assertions
- `VariableService.ts` - Variable resolution (environment, collection, global)
- `CollectionRunner.ts` - Batch execution of collection requests

### Frontend State Management (Zustand)

The frontend uses **Zustand** for state management with these stores:

- `authStore.ts` - Authentication state (user, tokens)
- `collectionStore.ts` - Collections, folders, requests (loaded per workspace)
- `environmentStore.ts` - Environment variables and active environment
- `workspaceStore.ts` - Workspace context and switching
- `tabStore.ts` - Tab state management for request builders
- `historyStore.ts` - Request execution history

**Store Pattern**: Each store is a Zustand store with:
```typescript
interface StoreState {
  // State properties
  data: T[];
  loading: boolean;
  error: string | null;
  
  // Actions as methods
  loadData: () => Promise<void>;
  updateData: (id: string, data: T) => Promise<void>;
}
```

### API Layer Organization

Backend follows a **three-layer architecture**:

```
routes/ (HTTP endpoints)
   ↓
controllers/ (Request validation, response formatting)
   ↓
services/ (Business logic, database operations)
   ↓
models/ (MongoDB) + prisma (PostgreSQL)
```

**Route Naming Convention**:
- `/api/auth/*` - Authentication endpoints
- `/api/workspaces/*` - Workspace CRUD
- `/api/collections/*` - Collections, folders, requests
- `/api/requests/*` - Request execution, history
- `/api/environments/*` - Environment variables
- `/api/graphql/*` - GraphQL endpoints

## Key Conventions

### Database Relationships & Cascade Deletes

The schema uses **cascade deletes** - when you delete a parent, all children are deleted:

- Delete Workspace → deletes Collections, Environments, Members
- Delete Collection → deletes child Folders, Requests, RequestBody (MongoDB)
- Delete Request → deletes RequestBody, ResponseBody (MongoDB)

Always verify cascade behavior when adding new relationships.

### Variable Resolution System

Variables use `{{variableName}}` syntax and are resolved in this order:

1. **Environment variables** (highest priority)
2. **Collection variables**
3. **Global variables** (lowest priority)

Variables are resolved:
- In request URL, headers, body
- Before pre-request scripts
- During test scripts via `pm.variables.get()`

### Request Types & GraphQL Support

The app supports three request types (`requestType` field):
- `'REST'` - Standard HTTP requests
- `'GRAPHQL'` - GraphQL queries/mutations with introspection
- `'WEBSOCKET'` - WebSocket connections (in progress)

**GraphQL-specific handling**:
- GraphQL requests have a `graphqlQuery` field instead of traditional body
- Use `GraphQLExecutor.ts` for execution
- Supports introspection for schema exploration
- Variables passed as JSON in the Variables tab

### Authentication Configuration

Authentication is stored as JSON in both PostgreSQL (Collection/Request `auth` field) and MongoDB (RequestBody `auth` field):

```typescript
{
  type: 'bearer' | 'basic' | 'apikey' | 'oauth1' | 'oauth2' | 'digest' | 'awsv4' | 'none',
  config: {
    // Type-specific configuration
    token?: string;         // bearer
    username?: string;      // basic
    password?: string;      // basic
    key?: string;          // apikey
    value?: string;        // apikey
    // ... etc
  }
}
```

### Pre-request & Test Scripts

Scripts are executed in a sandboxed environment with these globals:

```javascript
// Available in both pre-request and test scripts
pm.environment.get(key)
pm.environment.set(key, value)
pm.variables.get(key)
pm.variables.set(key, value)
pm.globals.get(key)
pm.globals.set(key, value)

// Test scripts only
pm.response.json()        // Parse JSON response
pm.response.text()        // Get text response
pm.response.code          // HTTP status code
pm.response.time          // Response time in ms

pm.test(name, fn)         // Define test
pm.expect(value)          // Chai expect assertions
```

### Collection Hierarchy & Order

Collections support **nested folders** with ordering:

- `type: 'COLLECTION'` - Root collection
- `type: 'FOLDER'` - Folder (can contain folders/requests)
- `type: 'REQUEST'` - Individual request

The `orderIndex` field controls display order. When reordering, update `orderIndex` values and call the update endpoint.

### Frontend Component Structure

Components follow this organization pattern:

```
src/components/
├── common/              # Reusable UI primitives
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── KeyValueEditor/  # For headers, params (key-value pairs)
├── request/             # Request building UI
│   ├── RequestBuilder/
│   ├── URLBar/
│   ├── TabsPanel/       # Params, Headers, Body, Auth tabs
│   └── BodyEditor/
├── response/            # Response viewing UI
│   ├── ResponseViewer/
│   ├── TestResults/
│   └── StatusBar/
└── collections/         # Collection management
    ├── CollectionTree/  # Sidebar tree view
    ├── CollectionRunner/
    └── ImportExport/
```

**Compound Component Pattern**: Complex components like tabs use compound components:

```typescript
<RequestTabs>
  <RequestTabs.List>
    <RequestTabs.Tab id="params">Params</RequestTabs.Tab>
  </RequestTabs.List>
  <RequestTabs.Panel id="params">...</RequestTabs.Panel>
</RequestTabs>
```

### MongoDB Models: RequestBody & ResponseBody

MongoDB stores large documents that don't fit well in PostgreSQL:

**RequestBody**: Stored once per request, contains:
- `headers[]` - Array of header key-value pairs
- `body` - Request body (JSON, form-data, etc.)
- `auth` - Authentication configuration
- `preRequestScript` - JavaScript code
- `testScript` - JavaScript code

**ResponseBody**: Stored per execution, contains:
- `requestHistoryId` - Links to PostgreSQL RequestHistory
- `status`, `statusText`, `headers[]`
- `body` - Response body
- `timing` - Response metrics
- `testResults[]` - Test execution results

### Environment Variables vs. Collection Variables

- **Environment Variables**: Workspace-scoped, switchable (Dev, Staging, Prod)
  - Stored in PostgreSQL `Environment` table
  - UI: Environment dropdown selector
  
- **Collection Variables**: Collection-scoped, always active for that collection
  - Stored as JSON in `Collection.variables` field
  - UI: Collection settings panel

### File Upload Handling

Data files (CSV/JSON) for data-driven testing:
- Uploaded to `backend/uploads/` directory
- Parsed by `DataFileService.ts`
- Used by `CollectionRunner.ts` for iteration

When processing uploads, use multer middleware from `middleware/upload.ts`.

### Error Handling Pattern

Both frontend and backend use custom error classes:

**Backend** (`utils/errors.ts`):
```typescript
throw new AppError('Invalid request', 400);
throw new NotFoundError('Request not found');
throw new UnauthorizedError('Invalid token');
```

**Frontend**: Errors are caught and displayed via `react-hot-toast`:
```typescript
try {
  await service.doSomething();
  toast.success('Success!');
} catch (error) {
  toast.error(error.message || 'Operation failed');
}
```

### Workspace Context

All operations are **workspace-scoped**:
- Users can own multiple workspaces
- Collections, Environments, Members belong to a workspace
- Frontend maintains `currentWorkspaceId` in `workspaceStore`
- Most API endpoints require `workspaceId` parameter

When adding new features, always consider workspace isolation.

### PM2 Production Deployment

The `ecosystem.config.js` configures PM2 for production:
- Backend runs on port 5000
- Frontend served with `serve` on port 5173
- Logs to `logs/` directory
- Auto-restart on crash

When deploying, ensure:
1. Build both apps (`npm run build`)
2. Databases are running
3. Environment variables are set
4. PM2 is installed globally

### Collection Runner & Batch Execution

The Collection Runner executes multiple requests sequentially:

1. Load all requests from collection/folder
2. For each request:
   - Resolve variables
   - Execute pre-request script
   - Send request
   - Execute test script
   - Store results
3. Generate execution report with pass/fail statistics

Data-driven testing: Provide CSV/JSON file, runner executes request once per data row.

## Important Notes

### TypeScript Configuration

- Backend: `tsconfig.json` compiles to `dist/`
- Frontend: `tsconfig.app.json` for app, `tsconfig.node.json` for Vite config
- Both use strict mode

### Environment Variables

Required variables:
- Backend: `DATABASE_URL`, `MONGODB_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`
- Frontend: `VITE_API_BASE_URL`

Copy `.env.example` to `.env` in each directory.

### Monaco Editor Integration

The frontend uses Monaco Editor for:
- Request body editing (JSON, XML)
- Pre-request & test scripts (JavaScript)
- GraphQL query editing

Import from `@monaco-editor/react`, not the full Monaco package.

### Request History

Every request execution is saved to:
1. PostgreSQL `RequestHistory` table (metadata)
2. MongoDB `ResponseBody` collection (full response)

History is user-scoped and persists across sessions.

### Testing Frameworks

- Backend: Jest with TypeScript support
- Frontend: Vitest (Vite-native test runner)

Both use similar Jest-like APIs (describe, test, expect).
