# Scripting API Reference

This document describes the scripting API available in pre-request and test scripts. The API is compatible with Postman's scripting interface, making it easy to migrate existing scripts.

## Table of Contents

- [Overview](#overview)
- [The `pm` Object](#the-pm-object)
- [Request Data](#request-data)
- [Response Data](#response-data)
- [Variables](#variables)
- [Path Parameters](#path-parameters)
- [Assertions & Testing](#assertions--testing)
- [Console Output](#console-output)
- [Examples](#examples)

---

## Overview

Scripts are JavaScript code that runs:
- **Pre-request scripts**: Execute before sending the request
- **Test scripts**: Execute after receiving the response

Both script types have access to the `pm` object, which provides methods to interact with requests, responses, variables, and more.

---

## The `pm` Object

The `pm` object is the primary interface for scripting. It provides access to:

- `pm.request` - Current request data
- `pm.response` - Response data (test scripts only)
- `pm.environment` - Environment variables
- `pm.collectionVariables` - Collection-scoped variables
- `pm.globals` - Global variables
- `pm.test()` - Define tests
- `pm.expect()` - Assertion methods

---

## Request Data

Access request information via `pm.request`:

### Properties

```javascript
pm.request.method       // HTTP method (GET, POST, etc.)
pm.request.url          // Full request URL
pm.request.headers      // Request headers object
pm.request.body         // Request body
pm.request.params       // Query parameters array
pm.request.pathParams   // Path parameters object
```

### Path Parameters

Path parameters are accessible as an object for easy access:

```javascript
// URL: /users/:userId/posts/:postId
// Path params: userId=123, postId=456

// Access as object properties
const userId = pm.request.pathParams.userId;     // "123"
const postId = pm.request.pathParams.postId;     // "456"

// Or use getter method
const userId = pm.request.getPathParam("userId"); // "123"

// Set path param value (pre-request scripts)
pm.request.setPathParam("userId", "789");
```

### Examples

```javascript
// Pre-request script: Set path param dynamically
pm.request.pathParams.userId = pm.environment.get("currentUserId");

// Pre-request script: Set multiple path params
pm.request.setPathParam("userId", "123");
pm.request.setPathParam("postId", "456");

// Test script: Verify correct path param was used
pm.test("Correct user ID used", function() {
  const userId = pm.request.pathParams.userId;
  pm.expect(userId).to.equal("123");
});

// Access query parameters
console.log("Query params:", pm.request.params);

// Access headers
console.log("Content-Type:", pm.request.headers["Content-Type"]);
```

---

## Response Data

Access response information via `pm.response` (test scripts only):

### Properties

```javascript
pm.response.code          // HTTP status code (e.g., 200)
pm.response.status        // HTTP status text (e.g., "OK")
pm.response.headers       // Response headers object
pm.response.body          // Response body (raw)
pm.response.responseTime  // Response time in milliseconds
pm.response.responseSize  // Response size in bytes
```

### Methods

```javascript
// Parse JSON response
const data = pm.response.json();

// Get response as text
const text = pm.response.text();

// Assertions
pm.response.to.have.status(200);
pm.response.to.have.header("Content-Type");
pm.response.to.have.header("Content-Type", "application/json");
pm.response.to.have.jsonSchema(schema);
```

### Examples

```javascript
// Parse JSON response
const data = pm.response.json();
console.log("User name:", data.name);

// Check status code
pm.test("Status code is 200", function() {
  pm.response.to.have.status(200);
});

// Check response time
pm.test("Response time is acceptable", function() {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

// Validate JSON schema
const schema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" }
  },
  required: ["id", "name"]
};

pm.test("Response matches schema", function() {
  pm.response.to.have.jsonSchema(schema);
});
```

---

## Variables

Variables allow you to store and reuse data across requests.

### Environment Variables

Environment-scoped variables (e.g., Dev, Staging, Prod):

```javascript
// Get environment variable
const apiUrl = pm.environment.get("apiUrl");

// Set environment variable
pm.environment.set("authToken", "abc123");

// Remove environment variable
pm.environment.unset("authToken");
```

### Collection Variables

Collection-scoped variables (available to all requests in a collection):

```javascript
// Get collection variable
const baseUrl = pm.collectionVariables.get("baseUrl");

// Set collection variable
pm.collectionVariables.set("userId", "123");

// Remove collection variable
pm.collectionVariables.unset("userId");
```

### Global Variables

Global variables (available across all workspaces):

```javascript
// Get global variable
const apiKey = pm.globals.get("apiKey");

// Set global variable
pm.globals.set("apiKey", "xyz789");

// Remove global variable
pm.globals.unset("apiKey");
```

### Variable Priority

When resolving `{{variableName}}` in requests, variables are checked in this order:
1. Environment variables (highest priority)
2. Collection variables
3. Global variables (lowest priority)

### Examples

```javascript
// Pre-request: Extract user ID from environment
const userId = pm.environment.get("currentUserId");
pm.request.setPathParam("userId", userId);

// Test: Save response data for next request
const data = pm.response.json();
pm.collectionVariables.set("authToken", data.token);
pm.environment.set("userId", data.id);

// Test: Save timestamp
pm.globals.set("lastRequestTime", Date.now());
```

---

## Path Parameters

Path parameters are placeholders in URLs that get replaced with actual values.

### URL Patterns

```
/users/:userId              → /users/123
/api/{version}/users/{id}   → /api/v1/users/456
/repos/:owner/:repo         → /repos/facebook/react
```

### Accessing Path Parameters

```javascript
// Direct object access (recommended)
const userId = pm.request.pathParams.userId;
const postId = pm.request.pathParams.postId;

// Using getter method
const userId = pm.request.getPathParam("userId");

// Check if path param exists
if (pm.request.pathParams.userId) {
  console.log("User ID:", pm.request.pathParams.userId);
}
```

### Setting Path Parameters

Path parameters can be set dynamically in pre-request scripts:

```javascript
// Set single path param
pm.request.setPathParam("userId", "123");

// Set from environment variable
pm.request.pathParams.userId = pm.environment.get("currentUserId");

// Set from previous response
const data = pm.response.json();
pm.request.setPathParam("userId", data.id.toString());

// Conditional path param
if (pm.environment.get("env") === "production") {
  pm.request.pathParams.apiVersion = "v2";
} else {
  pm.request.pathParams.apiVersion = "v1";
}
```

### Examples

```javascript
// Pre-request: Set path params from environment
pm.request.pathParams.owner = pm.environment.get("githubOwner");
pm.request.pathParams.repo = pm.environment.get("githubRepo");

// Test: Verify correct path params were used
pm.test("Correct repository accessed", function() {
  pm.expect(pm.request.pathParams.owner).to.equal("facebook");
  pm.expect(pm.request.pathParams.repo).to.equal("react");
});

// Pre-request: Generate dynamic path param
const timestamp = Date.now();
pm.request.setPathParam("requestId", `req_${timestamp}`);

// Test: Extract ID from response and use in next request
const responseData = pm.response.json();
pm.collectionVariables.set("nextUserId", responseData.userId);
// In next request, use {{nextUserId}} in path param value
```

---

## Assertions & Testing

Define tests using `pm.test()` and make assertions with `pm.expect()`:

### Basic Assertions

```javascript
pm.test("Status code is 200", function() {
  pm.response.to.have.status(200);
});

pm.test("Response has user data", function() {
  const data = pm.response.json();
  pm.expect(data).to.have.property("id");
  pm.expect(data).to.have.property("name");
});

pm.test("Response time is acceptable", function() {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

### Type Assertions

```javascript
pm.test("Data types are correct", function() {
  const data = pm.response.json();
  pm.expect(data.id).to.be.a("number");
  pm.expect(data.name).to.be.a("string");
  pm.expect(data.tags).to.be.an("array");
});
```

### Equality Assertions

```javascript
pm.test("Values match expected", function() {
  const data = pm.response.json();
  pm.expect(data.status).to.equal("active");
  pm.expect(data.count).to.eql(10); // Deep equality
});
```

### String Assertions

```javascript
pm.test("String contains expected text", function() {
  const text = pm.response.text();
  pm.expect(text).to.include("success");
  pm.expect(text).to.contain("user");
  pm.expect(text).to.match(/user-\d+/);
});
```

### Numeric Comparisons

```javascript
pm.test("Numeric values are in range", function() {
  const data = pm.response.json();
  pm.expect(data.count).to.be.above(0);
  pm.expect(data.count).to.be.below(100);
});
```

### Array/Object Assertions

```javascript
pm.test("Array has correct length", function() {
  const data = pm.response.json();
  pm.expect(data.users).to.have.length(5);
});

pm.test("Object has required properties", function() {
  const data = pm.response.json();
  pm.expect(data).to.have.property("id", 123);
  pm.expect(data).to.have.property("name");
});
```

### JSON Schema Validation

```javascript
pm.test("Response matches schema", function() {
  const schema = {
    type: "object",
    properties: {
      id: { type: "number" },
      name: { type: "string" },
      email: { type: "string", format: "email" },
      active: { type: "boolean" }
    },
    required: ["id", "name", "email"]
  };
  
  pm.response.to.have.jsonSchema(schema);
});
```

---

## Console Output

Use `console` methods to debug and log information:

```javascript
console.log("Request URL:", pm.request.url);
console.info("Processing request...");
console.warn("Rate limit approaching");
console.error("Authentication failed");

// Log objects
console.log("Response data:", pm.response.json());
console.log("Path params:", pm.request.pathParams);
```

Console output appears in the test results and can help debug scripts.

---

## Examples

### Complete Pre-request Script

```javascript
// Set environment-specific base URL
const env = pm.environment.get("environment");
if (env === "production") {
  pm.request.pathParams.apiVersion = "v2";
} else {
  pm.request.pathParams.apiVersion = "v1";
}

// Set user ID from environment
const userId = pm.environment.get("currentUserId");
if (userId) {
  pm.request.setPathParam("userId", userId);
} else {
  console.warn("No currentUserId found in environment");
}

// Add timestamp to request
const timestamp = new Date().toISOString();
pm.collectionVariables.set("requestTimestamp", timestamp);

console.log("Pre-request setup complete");
console.log("API Version:", pm.request.pathParams.apiVersion);
console.log("User ID:", pm.request.pathParams.userId);
```

### Complete Test Script

```javascript
// Test status code
pm.test("Status code is 200", function() {
  pm.response.to.have.status(200);
});

// Test response time
pm.test("Response time is acceptable", function() {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

// Test content type
pm.test("Content-Type is JSON", function() {
  pm.response.to.have.header("Content-Type");
  pm.expect(pm.response.headers["Content-Type"]).to.include("application/json");
});

// Parse and validate response
pm.test("Response has valid user data", function() {
  const data = pm.response.json();
  
  pm.expect(data).to.have.property("id");
  pm.expect(data).to.have.property("name");
  pm.expect(data).to.have.property("email");
  
  pm.expect(data.id).to.be.a("number");
  pm.expect(data.name).to.be.a("string");
  pm.expect(data.email).to.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
});

// Test path params were used correctly
pm.test("Correct user ID was requested", function() {
  const requestedUserId = pm.request.pathParams.userId;
  const responseUserId = pm.response.json().id;
  pm.expect(responseUserId.toString()).to.equal(requestedUserId);
});

// Save data for next request
const responseData = pm.response.json();
pm.collectionVariables.set("userName", responseData.name);
pm.environment.set("lastUserId", responseData.id);

console.log("Tests complete. User:", responseData.name);
```

### Data-Driven Testing with Path Parameters

```javascript
// CSV file: userId,expectedName
// Row 1: 1,John Doe
// Row 2: 2,Jane Smith

// Pre-request: Set path param from CSV data
pm.request.pathParams.userId = pm.variables.get("userId");

// Test: Verify response matches CSV data
pm.test("User name matches expected", function() {
  const data = pm.response.json();
  const expectedName = pm.variables.get("expectedName");
  pm.expect(data.name).to.equal(expectedName);
});
```

---

## Best Practices

1. **Use descriptive test names**: Make it clear what each test verifies
2. **Keep scripts focused**: One script should do one thing well
3. **Handle errors gracefully**: Check for existence before accessing properties
4. **Log important information**: Use console.log for debugging
5. **Reuse variables**: Store common values in collection/environment variables
6. **Validate responses**: Always check status code and response structure
7. **Use path params for dynamic URLs**: Leverage path params for cleaner, more maintainable requests
8. **Set defaults**: Provide default values for path params when possible

---

## Migration from Postman

This API is designed to be compatible with Postman's scripting interface. Most Postman scripts should work without modification.

### Key Differences

- Path parameters are accessed as `pm.request.pathParams.paramName` (object notation)
- Additional helper methods: `getPathParam()`, `setPathParam()`
- Console output is captured and displayed in the test results panel

### Supported Postman Features

- ✅ `pm.test()` and `pm.expect()` assertions
- ✅ `pm.response.json()` and `pm.response.text()`
- ✅ `pm.environment`, `pm.collectionVariables`, `pm.globals`
- ✅ `pm.response.to.have.status()`, `to.have.header()`, `to.have.jsonSchema()`
- ✅ Console methods (`console.log`, `console.info`, etc.)
- ✅ Path parameters via `pm.request.pathParams`

---

## Troubleshooting

### Common Issues

**Issue**: Variable not resolving in path param
```javascript
// ❌ Wrong: Using template literal in script
pm.request.pathParams.userId = "{{userId}}";

// ✅ Correct: Get variable value
pm.request.pathParams.userId = pm.environment.get("userId");
```

**Issue**: Accessing undefined property
```javascript
// ❌ Dangerous: May throw error
const name = pm.response.json().user.profile.name;

// ✅ Safe: Check existence
const data = pm.response.json();
if (data && data.user && data.user.profile) {
  const name = data.user.profile.name;
}
```

**Issue**: Test failing silently
```javascript
// ❌ Wrong: No test wrapper
pm.expect(pm.response.code).to.equal(200);

// ✅ Correct: Wrap in pm.test()
pm.test("Status is 200", function() {
  pm.expect(pm.response.code).to.equal(200);
});
```

---

## Reference Links

- [Project Documentation](../../README.md)
- [Path Parameters Guide](../features/path-parameters.md)
- [Variable Resolution](../features/variables.md)
- [Collection Runner](../features/collection-runner.md)

---

Last updated: April 2026
