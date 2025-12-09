# Database Schema Documentation

This document describes the database schema for the API Testing Tool application.

## Architecture Overview

The application uses a **hybrid database architecture**:

- **PostgreSQL**: Stores relational data (users, workspaces, collections, metadata)
- **MongoDB**: Stores flexible document data (request/response bodies, large payloads)

This approach provides:
- Strong consistency and relationships for metadata (PostgreSQL)
- Flexible schema and efficient storage for large documents (MongoDB)

---

## PostgreSQL Schema (via Prisma)

### 1. Users Table

Stores user authentication and profile information.

```prisma
model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String
  name          String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  workspaces    Workspace[]
  requestHistory RequestHistory[]
}
```

**Fields:**
- `id`: Unique identifier (UUID)
- `email`: User's email address (unique, used for login)
- `passwordHash`: Bcrypt-hashed password
- `name`: Optional display name
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- One-to-many with `Workspace` (user can own multiple workspaces)
- One-to-many with `RequestHistory` (user's request execution history)

---

### 2. Workspaces Table

Organizes collections and environments into separate workspaces.

```prisma
model Workspace {
  id          String        @id @default(uuid())
  name        String
  ownerId     String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  collections Collection[]
  environments Environment[]
}
```

**Fields:**
- `id`: Unique identifier (UUID)
- `name`: Workspace name (e.g., "Personal", "Team Project")
- `ownerId`: Foreign key to User
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- Many-to-one with `User` (workspace belongs to one user)
- One-to-many with `Collection`
- One-to-many with `Environment`

**Delete Behavior:** Cascade delete - deleting a workspace removes all its collections and environments

---

### 3. Collections Table

Supports hierarchical folder structure for organizing requests.

```prisma
model Collection {
  id              String       @id @default(uuid())
  name            String
  description     String?
  workspaceId     String
  parentFolderId  String?
  type            CollectionType
  orderIndex      Int          @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  workspace       Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  parentFolder    Collection?  @relation("CollectionHierarchy", fields: [parentFolderId], references: [id], onDelete: Cascade)
  childFolders    Collection[] @relation("CollectionHierarchy")
  requests        Request[]
}

enum CollectionType {
  COLLECTION
  FOLDER
}
```

**Fields:**
- `id`: Unique identifier (UUID)
- `name`: Collection or folder name
- `description`: Optional description
- `workspaceId`: Foreign key to Workspace
- `parentFolderId`: Self-referencing foreign key for hierarchy (null for root collections)
- `type`: `COLLECTION` (root) or `FOLDER` (nested)
- `orderIndex`: For custom sorting within parent
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- Many-to-one with `Workspace`
- Self-referencing for hierarchy (unlimited nesting)
- One-to-many with `Request`

**Features:**
- **Hierarchical structure**: Folders can contain other folders
- **Custom ordering**: `orderIndex` for drag-and-drop reordering
- **Type distinction**: Collections vs Folders

---

### 4. Requests Table

Stores metadata for HTTP requests.

```prisma
model Request {
  id              String    @id @default(uuid())
  name            String
  method          String
  url             String
  collectionId    String
  requestBodyId   String?
  orderIndex      Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  collection      Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  history         RequestHistory[]
}
```

**Fields:**
- `id`: Unique identifier (UUID)
- `name`: Request name/description
- `method`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `url`: Request URL (can include variables like `{{API_URL}}`)
- `collectionId`: Foreign key to Collection/Folder
- `requestBodyId`: Reference to MongoDB document (optional)
- `orderIndex`: For custom sorting within collection
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- Many-to-one with `Collection`
- One-to-many with `RequestHistory`

**Note:** Full request body (headers, auth, scripts) stored in MongoDB via `requestBodyId`

---

### 5. Environments Table

Stores environment variables for different environments (dev, staging, prod).

```prisma
model Environment {
  id          String    @id @default(uuid())
  name        String
  workspaceId String
  variables   Json      @default("[]")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
```

**Fields:**
- `id`: Unique identifier (UUID)
- `name`: Environment name (e.g., "Development", "Production")
- `workspaceId`: Foreign key to Workspace
- `variables`: JSON array of variables `[{key, value, type, enabled}]`
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

**Variable Structure:**
```json
[
  {
    "key": "API_URL",
    "value": "https://api.example.com",
    "type": "default",
    "enabled": true,
    "description": "Base API URL"
  },
  {
    "key": "API_KEY",
    "value": "secret_key",
    "type": "secret",
    "enabled": true
  }
]
```

**Variable Types:**
- `default`: Regular variable
- `secret`: Masked in UI

---

### 6. RequestHistory Table

Tracks execution history of requests.

```prisma
model RequestHistory {
  id              String    @id @default(uuid())
  requestId       String
  userId          String
  responseBodyId  String?
  statusCode      Int?
  responseTime    Int?
  executedAt      DateTime  @default(now())
  
  request         Request   @relation(fields: [requestId], references: [id], onDelete: Cascade)
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, executedAt])
  @@index([requestId])
}
```

**Fields:**
- `id`: Unique identifier (UUID)
- `requestId`: Foreign key to Request
- `userId`: Foreign key to User (who executed it)
- `responseBodyId`: Reference to MongoDB response document
- `statusCode`: HTTP status code (200, 404, 500, etc.)
- `responseTime`: Response time in milliseconds
- `executedAt`: Execution timestamp

**Indexes:**
- Composite index on `(userId, executedAt)` for efficient history queries
- Index on `requestId` for request-specific history

**Note:** Full response data stored in MongoDB via `responseBodyId`

---

## MongoDB Schema (via Mongoose)

### 1. RequestBodies Collection

Stores detailed request configuration.

```typescript
{
  requestId: String,        // References Request.id in PostgreSQL
  headers: [{
    key: String,
    value: String,
    enabled: Boolean
  }],
  body: {
    type: 'json' | 'form-data' | 'xml' | 'raw' | 'binary',
    content: Mixed
  },
  auth: {
    type: 'noauth' | 'basic' | 'bearer' | 'apikey' | 'oauth1' | 'oauth2' | 'digest' | 'awsv4',
    config: Mixed
  },
  preRequestScript: String,  // JavaScript code
  testScript: String,        // JavaScript code with assertions
  createdAt: Date
}
```

**Why MongoDB?**
- Flexible schema for different body types
- Efficient storage of large JSON payloads
- No need for complex joins

**Indexed Fields:**
- `requestId` (for quick lookups)

---

### 2. ResponseBodies Collection

Stores HTTP response data.

```typescript
{
  historyId: String,        // References RequestHistory.id in PostgreSQL
  headers: [{
    key: String,
    value: String
  }],
  body: Mixed,              // Can be JSON, text, HTML, binary
  cookies: [Mixed],
  size: Number,             // Response size in bytes
  createdAt: Date
}
```

**Why MongoDB?**
- Flexible storage for any response type
- Efficient for large responses
- Mixed content types support

**Indexed Fields:**
- `historyId` (for quick lookups)

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘

         ┌──────────┐
         │   User   │
         └─────┬────┘
               │ 1:N
         ┌─────▼────────┐
         │  Workspace   │
         └─────┬────────┘
               │ 1:N
         ┌─────▼──────────┬──────────┐
         │                │          │
    ┌────▼─────┐   ┌─────▼──────┐   │
    │Collection│   │Environment │   │
    └────┬─────┘   └────────────┘   │
         │                           │
    Self │                           │
    Ref. │ 1:N                       │
    ┌────▼────┐                      │
    │Request  │◄─────────────────────┘
    └────┬────┘           User + Request
         │ 1:N                 │ N:1
    ┌────▼──────────┐    ┌─────▼────────────┐
    │RequestHistory │    │  RequestHistory  │
    └───────────────┘    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Database                         │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌───────────────┐
    │RequestBodies │         │ResponseBodies │
    └──────┬───────┘         └───────┬───────┘
           │                         │
    requestId (ref)          historyId (ref)
           │                         │
    ┌──────▼──────┐          ┌──────▼────────┐
    │   Request   │          │RequestHistory │
    └─────────────┘          └───────────────┘
```

---

## Seed Data

The application includes seed data for development and testing:

### PostgreSQL Seed Data:
- **2 Users**: `john@example.com` and `jane@example.com` (password: `password123`)
- **2 Workspaces**: "Personal Workspace" and "Team Project"
- **3 Environments**: Development, Production, Staging
- **2 Collections**: "User API" and "E-commerce API"
- **3 Folders**: Authentication, Users, Products
- **9 Requests**: Login, Register, CRUD operations
- **5 History entries**: Sample execution records

### MongoDB Seed Data:
- **5 Request Bodies**: With headers, auth, scripts
- **5 Response Bodies**: Sample responses with various status codes

### Running Seed Scripts:

```bash
# Seed PostgreSQL only
npm run prisma:seed

# Seed MongoDB only
npm run seed:mongo

# Seed both databases
npm run seed:all
```

---

## Database Indexes

### PostgreSQL:
- `User.email` - Unique index for login
- `RequestHistory(userId, executedAt)` - Composite index for history queries
- `RequestHistory.requestId` - Index for request-specific history
- All primary keys automatically indexed

### MongoDB:
- `RequestBodies.requestId` - For quick request body lookup
- `ResponseBodies.historyId` - For quick response lookup

---

## Migration Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create and run migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database and re-seed
npx prisma migrate reset
```

---

## Best Practices

1. **Always use transactions** for operations that modify multiple tables
2. **Reference MongoDB IDs** in PostgreSQL for linking documents
3. **Index frequently queried fields** for performance
4. **Use cascade deletes** to maintain referential integrity
5. **Validate data** before saving to MongoDB (flexible schema = responsibility)
6. **Backup both databases** regularly in production

---

## Future Enhancements

- Add `Team` and `TeamMember` tables for collaboration
- Add `Comments` table for request annotations
- Add `Version` table for request history/versioning
- Add full-text search indexes for request/collection search
- Consider Redis for caching frequently accessed data
