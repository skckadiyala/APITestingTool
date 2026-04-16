# Requests

**Requests** are the core building blocks of API testing in Simba. Each request represents a single API call with all its configuration: URL, method, headers, body, authentication, and scripts.

## What is a Request?

A request is a configured API call that contains:

- **HTTP Method**: GET, POST, PUT, PATCH, DELETE, etc.
- **URL**: API endpoint with optional variables
- **Headers**: HTTP headers (Content-Type, Authorization, etc.)
- **Query Parameters**: URL parameters (?key=value)
- **Body**: Request payload (JSON, form-data, XML, etc.)
- **Authentication**: Auth configuration
- **Scripts**: Pre-request and test scripts

![Request Builder](../assets/screenshots/request-builder-overview.png)

---

## Request Types

Simba supports three types of requests:

### REST API Requests 🌐

Standard HTTP requests with full method support:
- GET - Retrieve data
- POST - Create new resources
- PUT - Replace resources
- PATCH - Update resources  
- DELETE - Remove resources
- HEAD, OPTIONS, TRACE

[Learn more about REST requests →](../requests/rest/get-requests.md)

### GraphQL Requests ◆

GraphQL queries and mutations with:
- Query editor
- Variables support
- Schema introspection
- Fragment support

[Learn more about GraphQL →](../requests/graphql/overview.md)

### WebSocket Connections ⚡

Real-time WebSocket testing:
- Connect to WebSocket servers
- Send and receive messages
- Monitor connection status

[Learn more about WebSocket →](../requests/websocket/connecting.md)

---

## Creating a Request

### Quick Create

![Create Request](../assets/screenshots/request-create-dialog.png)

**To create a request:**

1. Right-click a collection or folder
2. Select **Add Request**
3. Fill in basic details:
   - **Name**: Descriptive name
   - **Request Type**: REST, GraphQL, or WebSocket
   - **Method**: GET, POST, etc. (for REST)
   - **URL**: API endpoint
4. Click **Create**

### From Scratch

**To create without a collection first:**

1. Click **+ New** → **New Request**
2. If no collection exists, you'll be prompted to create one
3. Fill in request details
4. Click **Create**

---

## Request Configuration

### URL

The request URL can contain:

**Static URLs**:
```
https://api.example.com/users
```

**URLs with variables**:
```
{{baseUrl}}/api/v{{apiVersion}}/users/{{userId}}
```

**URLs with path parameters**:
```
{{baseUrl}}/users/:id
```

!!! tip "Variable Hover"
    Hover over `{{variable}}` to see its current value.

### HTTP Methods

| Method | Purpose | Has Body |
|--------|---------|----------|
| **GET** | Retrieve data | ❌ No |
| **POST** | Create resources | ✅ Yes |
| **PUT** | Replace resources | ✅ Yes |
| **PATCH** | Partial update | ✅ Yes |
| **DELETE** | Remove resources | ⚠️ Optional |
| **HEAD** | Get headers only | ❌ No |
| **OPTIONS** | Get allowed methods | ❌ No |

### Query Parameters

Add parameters that appear after `?` in the URL.

![Query Parameters](../assets/screenshots/params-tab.png)

| Key | Value | Description | Enabled |
|-----|-------|-------------|---------|
| `page` | `1` | Page number | ✅ |
| `limit` | `10` | Items per page | ✅ |
| `sort` | `name` | Sort field | ✅ |
| `filter` | `active` | Filter by status | ❌ |

**Resulting URL**:
```
https://api.example.com/users?page=1&limit=10&sort=name
```

Disabled parameters are ignored.

[Learn more about query parameters →](../requests/rest/query-params.md)

### Headers

HTTP headers provide metadata about the request.

![Headers](../assets/screenshots/headers-tab.png)

**Common Headers**:

| Header | Purpose | Example |
|--------|---------|---------|
| `Content-Type` | Request body format | `application/json` |
| `Accept` | Response format | `application/json` |
| `Authorization` | Authentication | `Bearer {{token}}` |
| `User-Agent` | Client identifier | `Simba/1.0` |
| `X-API-Key` | API key | `{{apiKey}}` |

**Auto-generated Headers**:
- `Content-Length`: Automatically calculated
- `Host`: From URL
- `Connection`: Managed by Simba

[Learn more about headers →](../requests/rest/headers.md)

### Request Body

Configure the request payload for POST, PUT, PATCH methods.

#### JSON Body

![JSON Body](../assets/screenshots/body-tab-json.png)

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "metadata": {
    "department": "Engineering",
    "level": {{userLevel}}
  }
}
```

**Features**:
- Syntax highlighting
- Auto-formatting (Cmd/Ctrl + Shift + F)
- Variable support
- Validation

#### Form Data

![Form Data](../assets/screenshots/body-tab-form-data.png)

| Key | Value | Type | Description |
|-----|-------|------|-------------|
| `username` | `johndoe` | Text | Username |
| `avatar` | `[Select File]` | File | Profile picture |
| `bio` | `Software Engineer` | Text | User bio |

**Use for**: File uploads, multipart/form-data requests

#### Other Body Types

- **Raw**: Plain text, XML, HTML, JavaScript
- **Binary**: Direct file upload
- **GraphQL**: Query/mutation editor

[Learn more about request bodies →](../requests/rest/request-body.md)

---

## Authentication

Configure authentication at the request level or inherit from collection.

![Authentication](../assets/screenshots/auth-tab-bearer.png)

### Auth Types

**Bearer Token**:
```
Authorization: Bearer {{authToken}}
```

**Basic Auth**:
```
Authorization: Basic base64(username:password)
```

**API Key**:
- Header: `X-API-Key: {{apiKey}}`
- Query: `?api_key={{apiKey}}`

**OAuth 2.0**:
- Full OAuth flow support
- Token management

[Learn more about authentication →](../auth/overview.md)

---

## Scripts

Add JavaScript code to run before/after requests.

### Pre-Request Scripts

![Pre-Request Script](../assets/screenshots/pre-request-script-editor.png)

Code that runs **before** the request is sent:

```javascript
// Set dynamic timestamp
pm.environment.set('timestamp', Date.now());

// Generate request ID
pm.environment.set('requestId', Math.random().toString(36).substring(7));

// Refresh token if expired
const tokenExpiry = pm.environment.get('tokenExpiry');
if (Date.now() > tokenExpiry) {
    // Token refresh logic
}

// Log request details
console.log('Sending request to:', pm.request.url);
```

**Common uses**:
- Set dynamic variables
- Generate timestamps
- Refresh authentication tokens
- Calculate signatures
- Prepare request data

### Test Scripts

![Test Script](../assets/screenshots/test-script-editor.png)

Code that runs **after** receiving the response:

```javascript
// Test 1: Status code
pm.test("Status code is 200", function() {
    pm.response.to.have.status(200);
});

// Test 2: Response time
pm.test("Response time under 500ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Test 3: JSON structure
pm.test("Response has required fields", function() {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.expect(data).to.have.property('name');
    pm.expect(data.name).to.be.a('string');
});

// Extract data for next request
const userId = pm.response.json().id;
pm.environment.set('extractedUserId', userId);
```

**Common uses**:
- Validate response status
- Assert response structure
- Extract data for next requests
- Calculate metrics
- Conditional logic

[Learn more about scripts →](../advanced/pre-request-scripts.md)

---

## Sending Requests

### Execute Request

**To send a request:**

1. Configure the request (URL, method, headers, body)
2. Click **Send** button (or press `Cmd/Ctrl + Enter`)
3. Wait for response
4. View results in Response Viewer

![Response](../assets/screenshots/response-viewer-json-body.png)

### Request Flow

```
1. Execute Pre-Request Script
        ↓
2. Resolve Variables ({{variable}})
        ↓
3. Apply Authentication
        ↓
4. Build HTTP Request
        ↓
5. Send Request ⚡
        ↓
6. Receive Response
        ↓
7. Execute Test Script
        ↓
8. Display Results
        ↓
9. Save to History
```

---

## Viewing Responses

### Response Status

![Status Bar](../assets/screenshots/response-status-bar.png)

**Status Information**:
- **Status Code**: 200 OK, 404 Not Found, 500 Error, etc.
- **Response Time**: Milliseconds
- **Response Size**: KB or MB

### Response Body

View response data in different formats:

**Pretty** (formatted):
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "address": {
    "city": "New York",
    "country": "USA"
  }
}
```

**Raw** (unformatted):
```json
{"id":1,"name":"John Doe","email":"john@example.com","address":{"city":"New York","country":"USA"}}
```

**Preview** (rendered HTML):
Displays HTML responses as rendered web pages.

### Response Headers

View all headers returned by the server:

```
content-type: application/json; charset=utf-8
content-length: 1234
x-ratelimit-limit: 100
x-ratelimit-remaining: 95
cache-control: no-cache
```

### Test Results

![Test Results](../assets/screenshots/test-results-passing.png)

See test execution results:
- ✅ Passed tests (with execution time)
- ❌ Failed tests (with error details)
- Summary: X/Y tests passed

---

## Request History

Every request execution is saved to history.

![Request History](../assets/screenshots/request-history-panel.png)

**History includes**:
- Timestamp
- Method and URL
- Status code
- Response time
- Full request/response details

**To view history:**
1. Click **History** tab in sidebar
2. Browse past executions
3. Click any entry to view details
4. Re-run previous requests

[Learn more about history →](../advanced/request-history.md)

---

## Organizing Requests

### Naming Conventions

Use descriptive names that explain what the request does:

✅ **Good**:
```
GET Get All Users
POST Create New User  
PUT Update User by ID
DELETE Remove User
```

❌ **Bad**:
```
Request 1
Test
Get Users
Update
```

### Folder Structure

Group related requests in folders:

```
📁 User Management
   ├─ GET List Users
   ├─ GET Get User by ID
   ├─ POST Create User
   ├─ PUT Update User
   └─ DELETE Delete User
```

### Request Descriptions

Add descriptions to document:
- What the request does
- Required parameters
- Expected responses
- Business logic

**Example**:
```markdown
## Get User by ID

Retrieves a single user by their unique ID.

**Path Parameters:**
- `id` (required): User's unique identifier

**Response:**
- `200`: User found and returned
- `404`: User not found
- `401`: Unauthorized
```

---

## Best Practices

### URL Structure

✅ **Do**:
- Use variables for base URLs: `{{baseUrl}}/users`
- Use variables for dynamic segments: `/users/{{userId}}`
- Use query params for filters: `?status=active&page=1`

❌ **Don't**:
- Hardcode URLs: `https://api.example.com/users`
- Mix path params and query params inconsistently

### Headers

✅ **Do**:
- Set Content-Type for POST/PUT requests
- Use variables for auth tokens: `Bearer {{token}}`
- Inherit common headers from collection
- Disable unused headers instead of deleting

❌ **Don't**:
- Duplicate headers across requests
- Hardcode sensitive values
- Leave outdated headers enabled

### Request Bodies

✅ **Do**:
- Format JSON properly (use auto-format)
- Use variables for dynamic data
- Validate JSON syntax before sending
- Document required fields in description

❌ **Don't**:
- Send invalid JSON
- Include unnecessary fields
- Hardcode test data
- Use production data in shared collections

### Scripts

✅ **Do**:
- Use descriptive test names
- Add error handling
- Log important information
- Clean up temporary variables

❌ **Don't**:
- Leave debug console.log everywhere
- Write tests without assertions
- Ignore script errors
- Set sensitive data in logs

---

## Related Topics

<div class="grid cards" markdown>

-   :material-web:{ .lg .middle } **REST API Requests**

    ---

    Complete guide to REST API testing

    [:octicons-arrow-right-24: REST Guide](../requests/rest/get-requests.md)

-   :material-graphql:{ .lg .middle } **GraphQL Requests**

    ---

    Test GraphQL APIs with queries and mutations

    [:octicons-arrow-right-24: GraphQL Guide](../requests/graphql/overview.md)

-   :material-shield-key:{ .lg .middle } **Authentication**

    ---

    Configure request authentication

    [:octicons-arrow-right-24: Auth Guide](../auth/overview.md)

-   :material-code-braces:{ .lg .middle } **Scripts**

    ---

    Write pre-request and test scripts

    [:octicons-arrow-right-24: Scripting Guide](../advanced/pre-request-scripts.md)

</div>

---

## Frequently Asked Questions

??? question "Can I reuse requests across collections?"
    No, each request belongs to one collection. Duplicate the request if needed in multiple collections.

??? question "How do I save a request?"
    Requests auto-save as you make changes. Click the **Save** button or press Cmd/Ctrl + S to force save.

??? question "Can I send multiple requests at once?"
    Use the Collection Runner to send multiple requests sequentially.

??? question "What happens if a request times out?"
    The request fails with a timeout error. Increase timeout in request settings or environment variables.

??? question "Can I download response bodies?"
    Yes, click the download icon in the response body tab to save the response to a file.

??? question "How do I duplicate a request?"
    Right-click the request and select **Duplicate Request**.

??? question "Can I compare responses?"
    View request history to see previous responses and compare them manually.

??? question "Do scripts have access to filesystem?"
    No, scripts run in a sandboxed environment with no filesystem access for security.
