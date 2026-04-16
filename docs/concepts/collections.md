# Collections

**Collections** are groups of related API requests organized in a hierarchical structure. They help you organize, share, and run multiple requests together.

## What is a Collection?

A collection is a folder-like container that holds:

- **Requests**: Individual API endpoints
- **Folders**: Nested sub-collections for organization
- **Variables**: Collection-scoped variables
- **Scripts**: Shared pre-request and test logic
- **Authentication**: Inherited authentication settings

![Collection Structure](../assets/screenshots/collection-tree.png)

```
📁 User Management API
   ├─ 📋 Collection Variables
   ├─ 🔐 Collection Authentication
   ├─ 📝 Collection Scripts
   │
   ├─ 📁 Users
   │   ├─ GET Get All Users
   │   ├─ GET Get User by ID
   │   ├─ POST Create User
   │   ├─ PUT Update User
   │   └─ DELETE Delete User
   │
   ├─ 📁 Authentication
   │   ├─ POST Login
   │   ├─ POST Register
   │   └─ POST Refresh Token
   │
   └─ 📁 Admin
       ├─ 📁 User Management
       │   ├─ GET List Users
       │   └─ PUT Update User Role
       └─ 📁 System
           ├─ GET System Status
           └─ POST Clear Cache
```

---

## Creating a Collection

### From the Sidebar

![Create Collection](../assets/screenshots/collection-create-dialog.png)

**To create a collection:**

1. Click **+ New** button in the sidebar
2. Select **New Collection**
3. Fill in the form:
   - **Name**: e.g., "User Management API"
   - **Description**: e.g., "Endpoints for managing users"
4. Click **Create**

The collection appears in the sidebar and is ready for requests.

### Quick Collection from Request

**To create a collection with a request:**

1. Click **+ New** → **New Request**
2. In the dialog:
   - **Name**: Request name
   - **Collection**: Select **+ Create New Collection**
   - Enter collection name
3. Click **Create**

Both the collection and request are created together.

---

## Collection Structure

### Hierarchy

Collections support unlimited nesting:

```
Collection (Root)
├─ Folder Level 1
│  ├─ Folder Level 2
│  │  ├─ Folder Level 3
│  │  │  └─ Request
│  │  └─ Request
│  └─ Request
└─ Request
```

!!! tip "Best Practice"
    Keep hierarchy shallow (2-3 levels) for easier navigation.

### Request Types

Collections can contain different request types:

| Type | Icon | Purpose |
|------|------|---------|
| **REST** | 🌐 | HTTP requests (GET, POST, PUT, etc.) |
| **GraphQL** | ◆ | GraphQL queries and mutations |
| **WebSocket** | ⚡ | WebSocket connections |

---

## Adding Requests to Collections

### Create New Request

![Create Request Dialog](../assets/screenshots/request-create-dialog.png)

**Method 1: Right-Click Menu**

1. Right-click collection or folder
2. Select **Add Request**
3. Fill in:
   - **Name**: e.g., "Get All Users"
   - **Method**: GET, POST, PUT, etc.
   - **URL**: API endpoint
4. Click **Create**

**Method 2: + New Button**

1. Click **+ New** → **New Request**
2. Select target collection/folder
3. Fill in request details
4. Click **Create**

### Duplicate Request

**To duplicate an existing request:**

1. Right-click the request
2. Select **Duplicate Request**
3. New request appears with "(Copy)" suffix
4. Rename and modify as needed

### Move Request

**To move a request between folders:**

1. Right-click the request
2. Select **Move to Folder**
3. Choose destination folder
4. Click **Move**

Or simply **drag and drop** requests in the tree.

---

## Collection-Level Configuration

Collections support shared settings that apply to all requests within them.

### Collection Variables

![Collection Variables](../assets/screenshots/collection-variables-editor.png)

Variables defined at the collection level are available to all requests in that collection.

**To add collection variables:**

1. Right-click collection
2. Select **Collection Settings**
3. Go to **Variables** tab
4. Add variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `apiVersion` | `v1` | `v1` |
| `userId` | `12345` | `12345` |
| `timeout` | `5000` | `5000` |

5. Click **Save**

**Usage in requests:**
```
{{apiVersion}}/users/{{userId}}
```

**Variable Resolution Order:**
1. Environment variables (highest priority)
2. Collection variables
3. Global variables (lowest priority)

[Learn more about variables →](variables.md)

### Collection Authentication

![Collection Auth](../assets/screenshots/collection-auth-config.png)

Set authentication once at the collection level instead of repeating it for every request.

**To configure collection auth:**

1. Right-click collection → **Collection Settings**
2. Go to **Authorization** tab
3. Select auth type:
   - Bearer Token
   - Basic Auth
   - API Key
   - OAuth 2.0
   - AWS Signature V4
4. Enter credentials
5. Click **Save**

**Inheritance**:
- ✅ All requests in the collection inherit this auth
- ✅ Individual requests can override collection auth
- ✅ Folders can override for their requests

[Learn more about authentication →](../auth/overview.md)

### Collection Scripts

![Collection Scripts](../assets/screenshots/collection-scripts-editor.png)

Write scripts that run for every request in the collection.

**Pre-Request Script** (runs before every request):
```javascript
// Set timestamp for all requests
pm.collectionVariables.set('timestamp', Date.now());

// Log request details
console.log('Executing:', pm.info.requestName);

// Refresh auth token if expired
const tokenExpiry = pm.collectionVariables.get('tokenExpiry');
if (Date.now() > tokenExpiry) {
    // Fetch new token logic here
}
```

**Test Script** (runs after every request):
```javascript
// Verify all responses have 2xx status
pm.test("Status is success", function() {
    pm.response.to.be.success;
});

// Log response time
console.log('Response time:', pm.response.responseTime, 'ms');

// Track API usage
const requestCount = pm.collectionVariables.get('requestCount') || 0;
pm.collectionVariables.set('requestCount', requestCount + 1);
```

**Script Execution Order:**
1. Collection pre-request script
2. Folder pre-request script (if in folder)
3. Request pre-request script
4. **REQUEST SENT** ⚡
5. Request test script
6. Folder test script (if in folder)
7. Collection test script

---

## Organizing Collections

### Folders

Create folders to group related requests.

**To create a folder:**

1. Right-click collection
2. Select **Add Folder**
3. Enter folder name: e.g., "Authentication"
4. Click **Create**

**To create a subfolder:**

1. Right-click a folder
2. Select **Add Subfolder**
3. Enter name
4. Click **Create**

### Naming Conventions

Use clear, descriptive names:

**Collections**:
```
✅ User Management API
✅ Payment Service v2
✅ E-commerce Backend

❌ API
❌ Collection 1
❌ Test
```

**Folders**:
```
✅ Authentication
✅ User CRUD
✅ Admin Functions

❌ Folder 1
❌ New Folder
❌ Misc
```

**Requests**:
```
✅ GET Get All Users
✅ POST Create User
✅ PUT Update User by ID

❌ Request 1
❌ Test
❌ Get
```

### Reordering

**To reorder requests/folders:**

**Method 1: Drag & Drop**
- Click and drag items up/down
- Drop in new position

**Method 2: Context Menu**
- Right-click item
- Select **Move Up** or **Move Down**

---

## Running Collections

Execute all requests in a collection sequentially using the **Collection Runner**.

### Running a Collection

![Collection Runner](../assets/screenshots/collection-runner-dialog.png)

**To run a collection:**

1. Right-click collection
2. Select **Run Collection**
3. Configure run:
   - **Environment**: Choose active environment
   - **Iterations**: Number of times to run (for data-driven testing)
   - **Delay**: Milliseconds between requests
   - **Data File**: Upload CSV/JSON for data-driven tests
4. Click **Run**

![Collection Runner Results](../assets/screenshots/collection-runner-results.png)

**Runner executes**:
- All requests in order
- Pre-request scripts
- Test scripts
- Captures results

**Results include**:
- ✅ Passed tests
- ❌ Failed tests
- ⏱️ Response times
- 📊 Success rate
- 📝 Execution logs

[Learn more about Collection Runner →](../advanced/collection-runner.md)

### Running a Folder

Run only requests within a specific folder:

1. Right-click folder
2. Select **Run Folder**
3. Configure and run

This executes only the requests within that folder (and subfolders).

---

## Sharing Collections

### Export Collection

![Export Collection](../assets/screenshots/export-collection-dialog.png)

**To export a collection:**

1. Right-click collection
2. Select **Export**
3. Choose format:
   - **Simba Format**: Full collection with scripts
   - **Postman v2.1**: Compatible with Postman
4. Click **Export**
5. Save JSON file

**Export includes**:
- All requests and folders
- Collection variables
- Pre-request and test scripts
- Authentication settings

**Export excludes**:
- Environment variables
- Request history
- Workspace members

### Import Collection

**To import a collection:**

1. Click **Import** button (sidebar)
2. Select source:
   - **Simba JSON**: From Simba export
   - **Postman Collection**: From Postman
   - **OpenAPI/Swagger**: Generate from API spec
3. Upload file
4. Select target workspace
5. Click **Import**

!!! tip "Postman Migration"
    Simba fully supports Postman Collection v2.1 format for easy migration.

[Learn more about import/export →](../collaboration/import-export.md)

### Share with Team

Share collections with workspace members:

1. Ensure team members are added to workspace
2. Collections are automatically visible to all members
3. Member permissions control what they can do:
   - **Viewers**: Can view and execute
   - **Editors**: Can modify requests
   - **Admins**: Can delete collections

[Learn more about permissions →](../collaboration/permissions.md)

---

## Collection Settings

Access comprehensive collection configuration.

**To open collection settings:**

1. Right-click collection
2. Select **Collection Settings**

### General Tab

- **Name**: Update collection name
- **Description**: Markdown-supported description
- **Created Date**: When collection was created
- **Request Count**: Number of requests in collection

### Variables Tab

Manage collection-scoped variables.

### Authorization Tab

Set collection-level authentication that all requests inherit.

### Pre-request Script Tab

JavaScript code that runs before every request in the collection.

### Test Script Tab

JavaScript code that runs after every request in the collection.

### Settings Tab

- **Request timeout**: Default timeout for all requests
- **Follow redirects**: Auto-follow HTTP redirects
- **SSL verification**: Enable/disable SSL certificate verification

---

## Best Practices

### Organization

✅ **Do**:
- Group related endpoints in collections
- Use folders for logical grouping
- Keep collections focused on one API/service
- Use consistent naming across collections

❌ **Don't**:
- Mix unrelated APIs in one collection
- Create too many nested folders (keep it 2-3 levels)
- Duplicate requests across collections
- Use vague names like "Test" or "Collection 1"

### Variables

✅ **Do**:
- Use collection variables for API-specific values
- Document variable purpose in descriptions
- Use environment variables for stage-specific values
- Set sensible default values

❌ **Don't**:
- Hardcode values that change between environments
- Use collection variables for secrets (use environments)
- Override variables without documenting why
- Create unused variables

### Scripts

✅ **Do**:
- Use collection scripts for shared logic
- Add descriptive test names
- Log important information to console
- Handle errors gracefully

❌ **Don't**:
- Duplicate logic across request scripts
- Write tests without assertions
- Leave debug console.log() statements
- Ignore script errors

### Maintenance

✅ **Do**:
- Remove outdated requests regularly
- Update descriptions when APIs change
- Version your collections (export with version in name)
- Test collections periodically

❌ **Don't**:
- Keep broken requests
- Let collections grow indefinitely
- Forget to update after API changes
- Skip testing before sharing

---

## Collection Examples

### RESTful CRUD Collection

```
📁 User API
   ├─ GET List Users (?page=1&limit=10)
   ├─ POST Create User
   ├─ GET Get User by ID (/:id)
   ├─ PUT Update User (/:id)
   ├─ PATCH Partial Update (/:id)
   └─ DELETE Delete User (/:id)
```

### Microservices Collection

```
📁 E-commerce Platform
   ├─ 📁 User Service
   │   ├─ Authentication
   │   └─ Profile Management
   ├─ 📁 Product Service
   │   ├─ Product CRUD
   │   └─ Inventory
   ├─ 📁 Order Service
   │   ├─ Create Order
   │   ├─ Order Status
   │   └─ Order History
   └─ 📁 Payment Service
       ├─ Process Payment
       └─ Refund
```

### Workflow Collection

```
📁 User Registration Flow
   ├─ 1. POST Register User
   ├─ 2. POST Verify Email
   ├─ 3. POST Login
   ├─ 4. GET Get User Profile
   └─ 5. PUT Update Profile
```

---

## Related Topics

<div class="grid cards" markdown>

-   :material-variable:{ .lg .middle } **Variables**

    ---

    Use collection and environment variables effectively

    [:octicons-arrow-right-24: Variables Guide](variables.md)

-   :material-shield-key:{ .lg .middle } **Authentication**

    ---

    Configure collection-level authentication

    [:octicons-arrow-right-24: Authentication Guide](../auth/overview.md)

-   :material-play-box-multiple:{ .lg .middle } **Collection Runner**

    ---

    Run entire collections for automated testing

    [:octicons-arrow-right-24: Collection Runner Guide](../advanced/collection-runner.md)

-   :material-export:{ .lg .middle } **Import/Export**

    ---

    Share collections and migrate from other tools

    [:octicons-arrow-right-24: Import/Export Guide](../collaboration/import-export.md)

</div>

---

## Frequently Asked Questions

??? question "How many requests can a collection have?"
    There's no limit, but for performance, we recommend keeping collections under 100 requests. Use folders to organize large collections.

??? question "Can I nest folders infinitely?"
    Yes, but we recommend 2-3 levels maximum for ease of navigation.

??? question "Do collection scripts run for every request?"
    Yes, collection scripts run for all requests unless overridden at the request level.

??? question "Can I duplicate a collection?"
    Export the collection and import it back with a new name.

??? question "How do I delete multiple requests at once?"
    Delete the folder containing them, or select multiple requests with Cmd/Ctrl+Click and press Delete.

??? question "Can different collections use the same request?"
    No, each request belongs to one collection. Duplicate the request if needed in multiple places.

??? question "Do collection variables override environment variables?"
    No, environment variables have higher priority than collection variables.

??? question "Can I share a collection without sharing the workspace?"
    Yes, export the collection as JSON and share the file. Others can import it into their own workspace.
