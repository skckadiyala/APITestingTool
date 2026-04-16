# Headers

Learn how to work with HTTP headers in API requests and responses.

---

## Overview

**HTTP Headers** are key-value pairs sent with requests and responses to provide metadata about the HTTP transaction.

**Headers Control:**
- 🔐 Authentication and authorization
- 📝 Content type and encoding
- 🌍 Language and caching
- 🔧 Custom application data

---

## Common Request Headers

### Content-Type

Specifies the media type of the request body.

```
Content-Type: application/json
Content-Type: application/xml
Content-Type: application/x-www-form-urlencoded
Content-Type: multipart/form-data
Content-Type: text/plain
```

**Example:**
```
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Authorization

Provides credentials to authenticate with the server.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
Authorization: API-Key abc123xyz789
```

**Using Variables:**
```
Authorization: Bearer {{authToken}}
```

### Accept

Specifies acceptable response formats.

```
Accept: application/json
Accept: application/xml
Accept: text/html
Accept: */*
```

**Multiple types:**
```
Accept: application/json, application/xml;q=0.9, */*;q=0.8
```

### User-Agent

Identifies the client making the request.

```
User-Agent: Simba API Tool/1.0
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
```

### Custom Headers

Application-specific headers (often prefixed with `X-`).

```
X-API-Key: your-api-key-here
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Client-Version: 1.2.3
X-Correlation-ID: abc-123-xyz
```

---

## Adding Headers in Simba

### Method 1: Headers Tab

```
Request Builder → Headers Tab

Key                    Value                         Description
─────────────────────  ────────────────────────────  ─────────────────────
Content-Type           application/json              ☑ Enabled
Authorization          Bearer {{token}}              ☑ Enabled
X-API-Key              {{apiKey}}                    ☑ Enabled
Accept                 application/json              ☐ Disabled
```

**Tips:**
- ✅ Use checkboxes to enable/disable headers
- ✅ Use variables for sensitive data: `{{apiKey}}`
- ✅ Add descriptions for team collaboration

### Method 2: Pre-request Script

```javascript
// Set headers dynamically
pm.request.headers.add({
    key: 'X-Request-Time',
    value: new Date().toISOString()
});

pm.request.headers.add({
    key: 'X-Request-ID',
    value: Math.random().toString(36).substring(7)
});

// Conditional headers
if (pm.environment.get('enableCompression')) {
    pm.request.headers.add({
        key: 'Accept-Encoding',
        value: 'gzip, deflate'
    });
}

// Update existing header
pm.request.headers.upsert({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('authToken')
});
```

---

## Response Headers

### Reading Response Headers

**Test Script:**
```javascript
// Get specific header
const contentType = pm.response.headers.get('Content-Type');
console.log('Content-Type:', contentType);

// Get all headers
pm.response.headers.each(header => {
    console.log(`${header.key}: ${header.value}`);
});

// Check if header exists
pm.test("Has Content-Type header", () => {
    pm.expect(pm.response.headers.has('Content-Type')).to.be.true;
});

// Validate header value
pm.test("Response is JSON", () => {
    const contentType = pm.response.headers.get('Content-Type');
    pm.expect(contentType).to.include('application/json');
});
```

### Common Response Headers

| Header | Purpose | Example |
|--------|---------|---------|
| **Content-Type** | Response format | `application/json; charset=utf-8` |
| **Content-Length** | Response size | `1234` |
| **Date** | Server timestamp | `Wed, 16 Apr 2026 12:00:00 GMT` |
| **Server** | Server software | `nginx/1.20.1` |
| **Cache-Control** | Caching directives | `no-cache, no-store, must-revalidate` |
| **ETag** | Resource version | `"686897696a7c876b7e"` |
| **Location** | Redirect/Created resource | `/users/123` |
| **Set-Cookie** | Cookie data | `session=abc123; Path=/; HttpOnly` |

---

## Authentication Headers

### Bearer Token

```
Authorization: Bearer {{accessToken}}
```

**Pre-request Script (Auto-refresh):**
```javascript
const token = pm.environment.get('accessToken');
const expiresAt = pm.environment.get('tokenExpiresAt');

// Check if token expired
if (!token || Date.now() >= expiresAt) {
    console.log('Token expired, refreshing...');
    
    // Refresh token request
    pm.sendRequest({
        url: pm.environment.get('authUrl') + '/refresh',
        method: 'POST',
        body: {
            mode: 'json',
            raw: JSON.stringify({
                refreshToken: pm.environment.get('refreshToken')
            })
        }
    }, (err, res) => {
        if (!err && res.code === 200) {
            const data = res.json();
            pm.environment.set('accessToken', data.accessToken);
            pm.environment.set('tokenExpiresAt', Date.now() + (data.expiresIn * 1000));
            console.log('✅ Token refreshed');
        }
    });
}
```

### Basic Authentication

```
Authorization: Basic {{base64Credentials}}
```

**Pre-request Script:**
```javascript
const username = pm.environment.get('username');
const password = pm.environment.get('password');

// Encode credentials
const credentials = CryptoJS.enc.Utf8.parse(`${username}:${password}`);
const base64 = CryptoJS.enc.Base64.stringify(credentials);

pm.request.headers.upsert({
    key: 'Authorization',
    value: 'Basic ' + base64
});
```

### API Key

**Header:**
```
X-API-Key: {{apiKey}}
```

**Query Parameter (alternative):**
```
GET /users?apiKey={{apiKey}}
```

---

## Conditional Headers

### If-None-Match (Caching)

```
GET /users/1

Headers:
  If-None-Match: "686897696a7c876b7e"
```

**Response:**
- `304 Not Modified` - Resource unchanged, use cached version
- `200 OK` - Resource modified, new data returned

**Test Script:**
```javascript
pm.test("Cache handling", () => {
    const status = pm.response.code;
    
    if (status === 304) {
        console.log('✅ Resource not modified, use cache');
    } else if (status === 200) {
        const etag = pm.response.headers.get('ETag');
        pm.environment.set('userETag', etag);
        console.log('✅ Resource updated, ETag saved:', etag);
    }
});
```

### If-Match (Optimistic Locking)

```
PUT /users/1

Headers:
  If-Match: "686897696a7c876b7e"

Body:
{
  "name": "Updated Name"
}
```

**Response:**
- `200 OK` - Update successful
- `412 Precondition Failed` - Resource was modified, ETag doesn't match

**Test Script:**
```javascript
pm.test("Concurrent update check", () => {
    const status = pm.response.code;
    
    if (status === 412) {
        console.log('⚠️  Conflict: Resource was modified by another user');
        console.log('Fetch latest version and retry');
    } else {
        pm.expect(status).to.equal(200);
        console.log('✅ Update successful');
    }
});
```

### If-Modified-Since

```
GET /users

Headers:
  If-Modified-Since: Wed, 15 Apr 2026 12:00:00 GMT
```

---

## Custom Header Patterns

### Request Tracking

```javascript
// Pre-request script
const requestId = require('uuid').v4();
pm.request.headers.add({
    key: 'X-Request-ID',
    value: requestId
});

pm.environment.set('currentRequestId', requestId);
console.log('Request ID:', requestId);
```

**Test Script:**
```javascript
// Verify request ID in response
const requestId = pm.environment.get('currentRequestId');
const responseRequestId = pm.response.headers.get('X-Request-ID');

pm.test("Request ID matches", () => {
    pm.expect(responseRequestId).to.equal(requestId);
});
```

### Rate Limiting

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1618574400
```

**Test Script:**
```javascript
pm.test("Rate limit status", () => {
    const remaining = parseInt(pm.response.headers.get('X-RateLimit-Remaining'));
    const limit = parseInt(pm.response.headers.get('X-RateLimit-Limit'));
    
    console.log(`API calls remaining: ${remaining}/${limit}`);
    
    if (remaining < limit * 0.1) {
        console.warn('⚠️  Rate limit almost exhausted!');
    }
    
    pm.expect(remaining).to.be.at.least(0);
});

// Save for monitoring
pm.collectionVariables.set('rateLimitRemaining', remaining);
```

### Correlation ID

```javascript
// Pre-request: Generate or reuse correlation ID
let correlationId = pm.collectionVariables.get('correlationId');
if (!correlationId) {
    correlationId = require('uuid').v4();
    pm.collectionVariables.set('correlationId', correlationId);
}

pm.request.headers.add({
    key: 'X-Correlation-ID',
    value: correlationId
});

console.log('Correlation ID:', correlationId);
```

---

## Header Validation

### Validate Request Headers

```javascript
// Pre-request script
pm.test("Required headers present", () => {
    pm.expect(pm.request.headers.has('Content-Type')).to.be.true;
    pm.expect(pm.request.headers.has('Authorization')).to.be.true;
});

const contentType = pm.request.headers.get('Content-Type');
pm.test("Content-Type is JSON", () => {
    pm.expect(contentType).to.include('application/json');
});
```

### Validate Response Headers

```javascript
pm.test("Security headers present", () => {
    pm.expect(pm.response.headers.has('X-Content-Type-Options')).to.be.true;
    pm.expect(pm.response.headers.has('X-Frame-Options')).to.be.true;
    pm.expect(pm.response.headers.has('Content-Security-Policy')).to.be.true;
});

pm.test("CORS headers configured", () => {
    const origin = pm.response.headers.get('Access-Control-Allow-Origin');
    pm.expect(origin).to.exist;
});

pm.test("Cache control set", () => {
    const cacheControl = pm.response.headers.get('Cache-Control');
    pm.expect(cacheControl).to.exist;
    console.log('Cache-Control:', cacheControl);
});
```

---

## Collection-Level Headers

### Set Headers for All Requests

**Collection Pre-request Script:**
```javascript
// Add common headers to every request
pm.request.headers.add({
    key: 'X-Client-Version',
    value: '1.0.0'
});

pm.request.headers.add({
    key: 'X-Timestamp',
    value: new Date().toISOString()
});

// Add auth header if not already present
if (!pm.request.headers.has('Authorization')) {
    const token = pm.environment.get('authToken');
    if (token) {
        pm.request.headers.add({
            key: 'Authorization',
            value: 'Bearer ' + token
        });
    }
}
```

---

## Headers Best Practices

### ✅ DO

**Use standard header names:**
```
✅ Content-Type
✅ Authorization
✅ Accept
❌ ContentType
❌ Auth
❌ ResponseFormat
```

**Store sensitive data in environment variables:**
```javascript
// ✅ Good
Authorization: Bearer {{authToken}}

// ❌ Bad - hardcoded
Authorization: Bearer abc123xyz789
```

**Validate header presence:**
```javascript
pm.test("Required headers", () => {
    pm.expect(pm.request.headers.has('Content-Type')).to.be.true;
});
```

**Use descriptive custom header names:**
```
✅ X-Request-ID
✅ X-Correlation-ID
✅ X-Client-Version
❌ X-RID
❌ X-Data
❌ X-Info
```

### ❌ DON'T

**Don't send unnecessary headers:**
```javascript
// ❌ Bad - cluttered
Host: api.example.com
Connection: keep-alive
Cache-Control: no-cache
Pragma: no-cache
// ... 20 more headers
```

**Don't hardcode credentials:**
```
// ❌ NEVER DO THIS
X-API-Key: sk_live_51HxYZ...
Authorization: Bearer eyJhbGc...
```

**Don't ignore security headers:**
```javascript
// ❌ Bad - no validation
pm.test("Status 200", () => {
    pm.expect(pm.response.code).to.equal(200);
});

// ✅ Good - check security
pm.test("Security headers present", () => {
    pm.expect(pm.response.headers.has('Strict-Transport-Security')).to.be.true;
});
```

---

## Header Debugging

### Log All Headers

```javascript
// Request headers
console.log('=== Request Headers ===');
pm.request.headers.each(header => {
    console.log(`${header.key}: ${header.value}`);
});

// Response headers
console.log('=== Response Headers ===');
pm.response.headers.each(header => {
    console.log(`${header.key}: ${header.value}`);
});
```

### Compare Request/Response Headers

```javascript
const requestContentType = pm.request.headers.get('Accept');
const responseContentType = pm.response.headers.get('Content-Type');

console.log('Requested:', requestContentType);
console.log('Received:', responseContentType);

pm.test("Content-Type matches Accept", () => {
    pm.expect(responseContentType).to.include(requestContentType.split(',')[0]);
});
```

### Track Header Changes

```javascript
// Save headers from previous request
const previousHeaders = pm.collectionVariables.get('previousResponseHeaders') || {};

// Compare
pm.response.headers.each(header => {
    const previousValue = previousHeaders[header.key];
    if (previousValue && previousValue !== header.value) {
        console.log(`Header changed: ${header.key}`);
        console.log(`  Previous: ${previousValue}`);
        console.log(`  Current:  ${header.value}`);
    }
});

// Save current headers
const currentHeaders = {};
pm.response.headers.each(header => {
    currentHeaders[header.key] = header.value;
});
pm.collectionVariables.set('previousResponseHeaders', currentHeaders);
```

---

## Common Header Scenarios

### Scenario 1: Multi-Language Support

```
Request:
  Accept-Language: es-ES, es;q=0.9, en;q=0.8

Response:
  Content-Language: es-ES

Test:
pm.test("Response in requested language", () => {
    const lang = pm.response.headers.get('Content-Language');
    pm.expect(lang).to.equal('es-ES');
});
```

### Scenario 2: Compression

```
Request:
  Accept-Encoding: gzip, deflate, br

Response:
  Content-Encoding: gzip

Test:
pm.test("Response is compressed", () => {
    const encoding = pm.response.headers.get('Content-Encoding');
    pm.expect(encoding).to.be.oneOf(['gzip', 'deflate', 'br']);
});
```

### Scenario 3: Pagination

```
Response Headers:
  X-Total-Count: 150
  X-Page-Size: 25
  X-Current-Page: 1
  Link: <https://api.example.com/users?page=2>; rel="next"

Test:
pm.test("Pagination headers present", () => {
    pm.expect(pm.response.headers.has('X-Total-Count')).to.be.true;
    pm.expect(pm.response.headers.has('Link')).to.be.true;
});

const totalCount = parseInt(pm.response.headers.get('X-Total-Count'));
const pageSize = parseInt(pm.response.headers.get('X-Page-Size'));
const totalPages = Math.ceil(totalCount / pageSize);

console.log(`Page 1 of ${totalPages} (${totalCount} total items)`);
```

---

## Related Topics

- [Authentication](../../auth/bearer-token.md) - Authorization headers
- [Request Body](request-body.md) - Content-Type for different body formats
- [Query Parameters](query-params.md) - Alternative to headers for simple data
- [Test Scripts](../../advanced/test-scripts.md) - Advanced header testing

---

*Need help? Check the [FAQ](../../reference/faq.md) or [Troubleshooting Guide](../../reference/troubleshooting.md)*
