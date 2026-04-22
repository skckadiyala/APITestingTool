# Path Parameters

Path parameters allow you to create dynamic URLs with variable segments, making it easy to test RESTful APIs with parameterized endpoints.

## What are Path Parameters?

Path parameters are placeholders in URLs that get replaced with actual values before the request is sent:

- **Template URL**: `/users/:userId/posts/:postId`
- **Resolved URL**: `/users/123/posts/456`

This allows you to create reusable request templates that work with different resource identifiers.

## Syntax

Two notations are supported for defining path parameters:

### Colon Notation (Recommended)
```
:paramName
```

**Examples:**
- `/users/:id`
- `/users/:userId/posts/:postId`
- `/repos/:owner/:repo/issues/:issue_number`

### Brace Notation
```
{paramName}
```

**Examples:**
- `/users/{id}`
- `/api/{version}/users/{userId}`
- `/repos/{owner}/{repo}/branches/{branch}`

**Note:** Both notations work identically. Choose the one that matches your API documentation or team conventions.

## Using Path Parameters

### 1. Auto-Detection

Path parameters are **automatically detected** when you enter a URL:

1. Type a URL in the URL bar: `https://api.github.com/repos/:owner/:repo`
2. Path parameters are instantly detected and displayed
3. Navigate to the **Params** tab to see the auto-populated path parameter fields

**Visual Indicators:**
- Blue badge in URL bar shows path parameter count: "2 params"
- Path parameters are highlighted in the URL preview
- Syntax highlighting: blue for filled params, red for empty params

### 2. Setting Values

To set path parameter values:

1. Navigate to the **Params** tab
2. Find the **Path Parameters** section (shown with blue accent)
3. Enter values for each detected parameter
4. Values are automatically substituted when you send the request

**Example:**

| Key | Value |
|-----|-------|
| owner | facebook |
| repo | react |

**Result:** `/repos/:owner/:repo` → `/repos/facebook/react`

### 3. Using Variables

Path parameter values support **variable substitution**, allowing you to use environment, collection, and global variables:

#### Environment Variables
```
URL: /users/:userId
Path Param: userId = {{currentUserId}}
```

If environment variable `currentUserId = 123`, the URL resolves to `/users/123`

#### Collection Variables
```
URL: /api/:version/users/:id
Path Params:
  - version = {{apiVersion}}
  - id = {{userId}}
```

#### Global Variables
```
URL: /{{baseUrl}}/users/:id
Path Param: id = {{globalUserId}}
```

**Variable Resolution Order:**
1. Environment variables (highest priority)
2. Collection variables
3. Global variables (lowest priority)

### 4. Script Access

Access and modify path parameters in **pre-request scripts** and **test scripts**:

#### Pre-Request Scripts

```javascript
// Get path parameter value
const userId = pm.request.pathParams.userId;
console.log("User ID:", userId);

// Set path parameter dynamically
pm.request.pathParams.userId = pm.environment.get("currentUserId");

// Set multiple path params
pm.request.pathParams.owner = "facebook";
pm.request.pathParams.repo = "react";

// Generate dynamic path param
const timestamp = Date.now();
pm.request.pathParams.id = `user_${timestamp}`;
```

#### Test Scripts

```javascript
// Verify path parameter was used correctly
pm.test("Correct user ID used", function() {
  const userId = pm.request.pathParams.userId;
  pm.expect(userId).to.equal("123");
});

// Access path params for assertions
const owner = pm.request.pathParams.owner;
const repo = pm.request.pathParams.repo;
pm.test(`Testing ${owner}/${repo} repository`, function() {
  pm.response.to.have.status(200);
});

// Log path params for debugging
console.log("Path params used:", JSON.stringify(pm.request.pathParams));
```

#### Helper Methods

```javascript
// Get specific path parameter
const userId = pm.request.getPathParam("userId");

// Set specific path parameter
pm.request.setPathParam("userId", "456");

// Check if path param exists
if (pm.request.pathParams.hasOwnProperty("userId")) {
  console.log("userId path param is defined");
}
```

## Collection Runner

Path parameters work seamlessly with **data-driven testing** in the Collection Runner.

### Basic Usage

**CSV Data File (`users.csv`):**
```csv
userId,postId
123,1
123,2
456,3
```

**Request Configuration:**
- **URL**: `/users/:userId/posts/:postId`
- **Path Parameters**:
  - `userId = {{userId}}`
  - `postId = {{postId}}`

**Execution:**
The runner will execute the request **three times**, once per CSV row:

| Iteration | userId | postId | Resolved URL |
|-----------|--------|--------|--------------|
| 1 | 123 | 1 | `/users/123/posts/1` |
| 2 | 123 | 2 | `/users/123/posts/2` |
| 3 | 456 | 3 | `/users/456/posts/3` |

### JSON Data File

**`test-data.json`:**
```json
[
  { "owner": "facebook", "repo": "react", "issue": "100" },
  { "owner": "microsoft", "repo": "vscode", "issue": "200" },
  { "owner": "vercel", "repo": "next.js", "issue": "300" }
]
```

**Request Configuration:**
- **URL**: `/repos/:owner/:repo/issues/:issue`
- **Path Parameters**:
  - `owner = {{owner}}`
  - `repo = {{repo}}`
  - `issue = {{issue}}`

### Advanced: Combining with Pre-Request Scripts

```javascript
// Pre-request script in collection
const currentRow = pm.iterationData.toObject();
pm.request.pathParams.userId = currentRow.userId || "default";
pm.request.pathParams.postId = currentRow.postId || "1";

console.log(`Testing user ${pm.request.pathParams.userId}, post ${pm.request.pathParams.postId}`);
```

## Path Parameters vs. Query Parameters

Understanding the difference:

| Feature | Path Parameters | Query Parameters |
|---------|----------------|------------------|
| **Location** | Part of the URL path | After `?` in URL |
| **Example** | `/users/:id` | `/users?id=123` |
| **Purpose** | Identify specific resource | Filter, sort, paginate |
| **REST Convention** | Resource identifier | Optional modifiers |
| **URL Structure** | `/resource/:id` | `/resource?param=value` |
| **Multiple Values** | Each has unique name | Can repeat: `?tag=a&tag=b` |

**Example Combined Usage:**
```
GET /users/:userId/posts?status=published&limit=10

Path Param: userId = 123
Query Params: status=published, limit=10

Result: /users/123/posts?status=published&limit=10
```

## Common Use Cases

### RESTful CRUD Operations

```javascript
// Create
POST /users
Body: { "name": "John Doe" }

// Read
GET /users/:userId
Path Param: userId = 123

// Update
PUT /users/:userId
Path Param: userId = 123
Body: { "name": "Jane Doe" }

// Delete
DELETE /users/:userId
Path Param: userId = 123
```

### Nested Resources

```javascript
// Get user's posts
GET /users/:userId/posts
Path Param: userId = 123

// Get specific post
GET /users/:userId/posts/:postId
Path Params: userId = 123, postId = 456

// Get post comments
GET /users/:userId/posts/:postId/comments
Path Params: userId = 123, postId = 456
```

### Versioned APIs

```javascript
// API versioning
GET /api/:version/users/:userId
Path Params: version = v2, userId = 123

// With environment variable
GET /api/{{apiVersion}}/users/:userId
Environment: apiVersion = v2
Path Param: userId = 123
```

### GitHub API Examples

```javascript
// Get repository
GET https://api.github.com/repos/:owner/:repo
Path Params: owner = facebook, repo = react

// Get issue
GET https://api.github.com/repos/:owner/:repo/issues/:issue_number
Path Params: owner = facebook, repo = react, issue_number = 100

// Get pull request
GET https://api.github.com/repos/:owner/:repo/pulls/:pull_number
Path Params: owner = facebook, repo = react, pull_number = 50
```

## Tips and Best Practices

### 1. Use Descriptive Parameter Names

**❌ Bad:**
```
/users/:id/posts/:id2
```

**✅ Good:**
```
/users/:userId/posts/:postId
```

**Why:** Clear names improve readability and reduce confusion in scripts.

### 2. Set Default Values in Collection Variables

Create collection variables for commonly used path parameters:

```javascript
// Collection Variables
userId = 123
postId = 1
apiVersion = v2

// Request Path Params
userId = {{userId}}
postId = {{postId}}
```

This allows you to:
- Change values in one place
- Reuse across multiple requests
- Override with environment variables

### 3. Use Environment Variables for Different Environments

**Development Environment:**
```
baseUrl = https://dev-api.example.com
userId = dev-user-123
```

**Production Environment:**
```
baseUrl = https://api.example.com
userId = prod-user-456
```

Switch environments to test the same requests against different servers with different data.

### 4. Validate Path Parameters in Pre-Request Scripts

```javascript
// Ensure path params are set
const userId = pm.request.pathParams.userId;
if (!userId || userId.trim() === '') {
  throw new Error("userId path parameter is required");
}

// Validate format
if (!/^\d+$/.test(userId)) {
  throw new Error("userId must be a number");
}
```

### 5. Log Resolved URLs for Debugging

```javascript
// Pre-request script
console.log("Path params:", JSON.stringify(pm.request.pathParams));

// Test script
console.log("Request URL:", pm.request.url);
```

Check the console to see the actual URL that was sent.

### 6. Combine with Query Parameters Wisely

```javascript
// Good: Path param for resource, query params for filtering
GET /users/:userId/posts?status=published&limit=10

// Avoid: Using query params for resource identification
GET /users?userId=123  // Use /users/:userId instead
```

### 7. Handle Special Characters

If path parameter values contain special characters:

```javascript
// Pre-request script: URL encode if needed
pm.request.pathParams.username = encodeURIComponent(pm.variables.get("username"));
```

The application automatically encodes most special characters, but manual encoding gives you more control.

### 8. Test with Multiple Values

Create a collection runner dataset to test various scenarios:

```csv
userId,expectedStatus
123,200
456,200
999,404
invalid,400
```

This helps verify your API handles different inputs correctly.

## Troubleshooting

### Path Parameter Not Detected

**Problem:** URL has `:userId` but parameter doesn't appear in Params tab.

**Solutions:**
- Ensure the URL follows the pattern `:paramName` or `{paramName}`
- Check for typos: `:user-id` won't work (use underscores: `:user_id`)
- Refresh the page or re-type the URL

### Variable Not Resolving

**Problem:** Path param value `{{userId}}` stays as literal text.

**Solutions:**
- Verify the variable exists in the current environment
- Check variable spelling (case-sensitive)
- Ensure environment is selected in the dropdown
- Use the Variables tab to view all available variables

### Path Parameter Shows as Empty

**Problem:** Red warning badge shows empty path parameters.

**Solutions:**
- Navigate to Params tab and fill in the values
- Set default values in collection/environment variables
- Use pre-request script to set values dynamically

### Request Fails After Adding Path Parameters

**Problem:** Request worked before adding path params, now fails.

**Solutions:**
- Check the resolved URL in request history
- Verify path param values are correct
- Ensure you didn't accidentally remove query parameters
- Compare original URL with resolved URL in response panel

## Migration from Postman

If you're migrating from Postman:

1. **Import Collections:** Path parameters are automatically imported from Postman collections
2. **Syntax Compatibility:** Both `:param` and `{param}` syntaxes are supported
3. **Scripts:** `pm.request.pathParams` works the same way as in Postman
4. **Variables:** `{{variableName}}` syntax is identical
5. **Runner:** CSV/JSON data files work the same way

**Postman Collection Import:**
- Exported Postman collections preserve path parameters
- All path param values and descriptions are retained
- No manual conversion needed

## Additional Resources

- **[Getting Started Guide](../getting-started.md)** - Learn the basics of the application
- **[Variables Guide](../variables/README.md)** - Deep dive into variable usage
- **[Scripting Guide](../scripting/README.md)** - Learn pre-request and test scripting
- **[Collection Runner Guide](../collection-runner/README.md)** - Data-driven testing
- **[API Reference](../api-reference.md)** - Complete API documentation

## Examples Collection

Import the **"Path Parameters Examples"** collection to see working examples of:
- Single path parameter requests
- Multiple path parameters
- Path params with query parameters
- Path params with variables
- Path params in collection runner
- Advanced scripting patterns

**To import:**
1. Click **Import** button in the sidebar
2. Select `examples/path-parameters-examples.json`
3. Explore and run the example requests

---

**Need Help?** Check the inline help tooltips in the application or refer to the troubleshooting section above.
