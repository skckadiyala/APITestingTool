# Scripting API Reference

Complete reference for writing pre-request and test scripts in Simba.

---

## Overview

Simba supports JavaScript scripting for:
- **Pre-request scripts**: Run before sending the request
- **Test scripts**: Run after receiving the response

Scripts use the `pm.*` API, compatible with Postman scripts.

---

## The `pm` Object

### `pm.request`

Access the current request.

```javascript
// Get request URL
const url = pm.request.url.toString();

// Get request method
const method = pm.request.method;

// Get headers
const headers = pm.request.headers;
```

### `pm.response`

Access the response (only in test scripts).

```javascript
// Get status code
const status = pm.response.code;

// Get response time (ms)
const time = pm.response.responseTime;

// Get response body as JSON
const jsonData = pm.response.json();

// Get response body as text
const text = pm.response.text();

// Get response headers
const headers = pm.response.headers;
```

### `pm.environment`

Work with environment variables.

```javascript
// Get environment variable
const apiKey = pm.environment.get(\"apiKey\");

// Set environment variable
pm.environment.set(\"token\", \"abc123\");

// Check if variable exists
if (pm.environment.has(\"userId\")) {
    // Do something
}

// Remove variable
pm.environment.unset(\"tempVar\");
```

### `pm.variables`

Access all variables (environment, collection, global).

```javascript
// Get variable (searches all scopes)
const value = pm.variables.get(\"variableName\");

// Set variable
pm.variables.set(\"tempValue\", \"test\");
```

### `pm.globals`

Work with global variables.

```javascript
// Get global variable
const baseUrl = pm.globals.get(\"baseUrl\");

// Set global variable
pm.globals.set(\"timestamp\", Date.now());

// Remove global variable
pm.globals.unset(\"oldVar\");
```

### `pm.collectionVariables`

Work with collection-level variables.

```javascript
// Get collection variable
const apiVersion = pm.collectionVariables.get(\"version\");

// Set collection variable
pm.collectionVariables.set(\"lastRun\", new Date().toISOString());
```

---

## Testing API

### `pm.test()`

Define a test.

```javascript
pm.test(\"Status code is 200\", function() {
    pm.response.to.have.status(200);
});
```

### `pm.expect()`

Chai assertion library.

```javascript
// Basic assertions
pm.expect(1 + 1).to.equal(2);
pm.expect(\"hello\").to.be.a(\"string\");
pm.expect([1, 2, 3]).to.include(2);

// Response assertions
const jsonData = pm.response.json();
pm.expect(jsonData.name).to.exist;
pm.expect(jsonData.age).to.be.above(18);
pm.expect(jsonData.email).to.match(/^.+@.+\\..+$/);
```

### Common Assertions

```javascript
// Status code
pm.response.to.have.status(200);
pm.response.to.have.status(\"OK\");

// Headers
pm.response.to.have.header(\"Content-Type\");
pm.response.to.have.header(\"Content-Type\", \"application/json\");

// Response body
pm.response.to.be.json;
pm.response.to.be.ok;  // Status 200-299

// Response time
pm.expect(pm.response.responseTime).to.be.below(500);
```

---

## Examples

### Pre-Request Script Examples

#### Set Dynamic Timestamp

```javascript
// Add current timestamp to environment
const timestamp = Date.now();
pm.environment.set(\"timestamp\", timestamp);
```

#### Generate Random Data

```javascript
// Generate random user ID
const randomId = Math.floor(Math.random() * 1000);
pm.environment.set(\"userId\", randomId);

// Generate UUID
const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});
pm.environment.set(\"requestId\", uuid);
```

#### Calculate Authentication Hash

```javascript
// Generate HMAC signature
const apiKey = pm.environment.get(\"apiKey\");
const secret = pm.environment.get(\"apiSecret\");
const timestamp = Date.now();

// Simple hash (in production, use proper HMAC)
const signature = btoa(`${apiKey}:${timestamp}:${secret}`);
pm.environment.set(\"signature\", signature);
```

### Test Script Examples

#### Basic Response Validation

```javascript
// Verify status code
pm.test(\"Status code is 200\", function() {
    pm.response.to.have.status(200);
});

// Verify response time
pm.test(\"Response time < 500ms\", function() {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Verify content type
pm.test(\"Content-Type is JSON\", function() {
    pm.response.to.have.header(\"Content-Type\", /application\\/json/);
});
```

#### JSON Response Validation

```javascript
pm.test(\"Response has required fields\", function() {
    const jsonData = pm.response.json();
    
    pm.expect(jsonData).to.have.property(\"id\");
    pm.expect(jsonData).to.have.property(\"name\");
    pm.expect(jsonData).to.have.property(\"email\");
    
    pm.expect(jsonData.id).to.be.a(\"number\");
    pm.expect(jsonData.name).to.be.a(\"string\");
    pm.expect(jsonData.email).to.match(/^.+@.+\\..+$/);
});
```

#### Array Response Validation

```javascript
pm.test(\"Response is an array with items\", function() {
    const jsonData = pm.response.json();
    
    pm.expect(jsonData).to.be.an(\"array\");
    pm.expect(jsonData).to.have.length.above(0);
    
    // Check first item structure
    const firstItem = jsonData[0];
    pm.expect(firstItem).to.have.property(\"id\");
    pm.expect(firstItem).to.have.property(\"title\");
});
```

#### Save Response Data for Next Request

```javascript
pm.test(\"Extract and save token\", function() {
    const jsonData = pm.response.json();
    
    // Save token for use in subsequent requests
    pm.environment.set(\"authToken\", jsonData.token);
    
    // Save user ID
    pm.environment.set(\"currentUserId\", jsonData.user.id);
});
```

#### Schema Validation

```javascript
pm.test(\"Response matches schema\", function() {
    const jsonData = pm.response.json();
    
    const schema = {
        type: \"object\",
        required: [\"id\", \"name\", \"email\"],
        properties: {
            id: { type: \"number\" },
            name: { type: \"string\", minLength: 1 },
            email: { type: \"string\", format: \"email\" },
            age: { type: \"number\", minimum: 0 }
        }
    };
    
    pm.expect(tv4.validate(jsonData, schema)).to.be.true;
});
```

---

## Advanced Techniques

### Conditional Logic

```javascript
// Different assertions based on environment
const env = pm.environment.get(\"environment\");

if (env === \"production\") {
    pm.test(\"Production - Response must be fast\", function() {
        pm.expect(pm.response.responseTime).to.be.below(200);
    });
} else {
    pm.test(\"Dev - Response time OK\", function() {
        pm.expect(pm.response.responseTime).to.be.below(1000);
    });
}
```

### Retry Logic (Pre-request)

```javascript
// Increment retry counter
let retryCount = pm.environment.get(\"retryCount\") || 0;
pm.environment.set(\"retryCount\", retryCount + 1);

// Check max retries
if (retryCount > 3) {
    console.error(\"Max retries exceeded\");
    pm.environment.unset(\"retryCount\");
}
```

### Dynamic URL Construction

```javascript
// Build URL from parts
const baseUrl = pm.environment.get(\"baseUrl\");
const version = pm.collectionVariables.get(\"apiVersion\");
const endpoint = \"users\";

const fullUrl = `${baseUrl}/api/${version}/${endpoint}`;
pm.environment.set(\"requestUrl\", fullUrl);
```

---

## Console Output

```javascript
// Debug output
console.log(\"Current environment:\", pm.environment.name);
console.log(\"Response data:\", pm.response.json());

// Variable inspection
console.log(\"All variables:\", pm.variables.toObject());
```

View console logs in the **Response** → **Console** tab.

---

## Best Practices

✅ **Keep scripts simple** - Complex logic should be in your application  
✅ **Use descriptive test names** - Makes debugging easier  
✅ **Clean up temp variables** - Use `pm.environment.unset()` after use  
✅ **Log important data** - Use `console.log()` for debugging  
✅ **Handle errors** - Use try/catch for robust scripts  

```javascript
try {
    const jsonData = pm.response.json();
    pm.environment.set(\"userId\", jsonData.id);
} catch (error) {
    console.error(\"Failed to parse response:\", error);
}
```

---

## Next Steps

- [Pre-request Scripts Guide](../advanced/pre-request-scripts.md)
- [Test Scripts Guide](../advanced/test-scripts.md)
- [Variables Documentation](../concepts/variables.md)
- [Collection Runner](../advanced/collection-runner.md)
