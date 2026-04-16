# Pre-request Scripts

Pre-request scripts are JavaScript code that runs **before** your request is sent. Use them to set up dynamic data, manipulate variables, and prepare your request.

---

## Overview

Pre-request scripts enable you to:
- **Set dynamic values**: Generate timestamps, UUIDs, random data
- **Modify variables**: Update environment, collection, or global variables
- **Transform data**: Encode, hash, sign request data
- **Conditional logic**: Skip requests, change URLs based on conditions
- **Prepare authentication**: Generate tokens, signatures, headers

**Execution Order:**
```
1. Collection pre-request script (if exists)
2. Folder pre-request script (if exists)
3. Request pre-request script
4. → Request is sent →
5. Request test script
6. Folder test script (if exists)
7. Collection test script (if exists)
```

---

## Where to Add Pre-request Scripts

### 1. Request Level (Most Common)

![Pre-request Script Tab](../assets/screenshots/request-prescript-tab.png)

1. Open your request
2. Go to the **Pre-request Script** tab
3. Write JavaScript code
4. Save the request

**Use case:** Request-specific logic (generate order ID for this specific POST request)

### 2. Collection Level

1. Right-click collection → **Edit Collection**
2. Go to **Pre-request Script** tab
3. Write JavaScript code that runs before **every request** in the collection

**Use case:** Collection-wide setup (authenticate once, set common headers)

### 3. Folder Level

1. Right-click folder → **Edit Folder**
2. Go to **Pre-request Script** tab
3. Runs before every request in this folder and subfolders

**Use case:** Section-specific logic (admin endpoints need admin token)

---

## Available APIs

Pre-request scripts have access to the `pm` object (Simba scripting API):

### Variable Management
```javascript
pm.environment.get(key)
pm.environment.set(key, value)
pm.environment.unset(key)

pm.collectionVariables.get(key)
pm.collectionVariables.set(key, value)

pm.globals.get(key)
pm.globals.set(key, value)

pm.variables.get(key)  // Gets from any scope (environment > collection > global)
pm.variables.set(key, value)  // Sets in current request scope
```

### Request Manipulation
```javascript
pm.request.url                  // Get/set URL
pm.request.method               // Get/set method (GET, POST, etc.)
pm.request.headers.add({...})   // Add header
pm.request.body.update({...})   // Update body
```

### Utility Functions
```javascript
// Not available in pre-request, only in test scripts:
pm.response, pm.test, pm.expect, etc.
```

**📖 Full API Reference**: See [Scripting API Reference](../reference/scripting-api.md)

---

## Common Use Cases

### 1. Generate Timestamp

```javascript
// Current timestamp (milliseconds)
const timestamp = Date.now();
pm.environment.set('current_timestamp', timestamp);

// ISO 8601 format
const isoTimestamp = new Date().toISOString();
pm.environment.set('iso_timestamp', isoTimestamp);

// Unix timestamp (seconds)
const unixTimestamp = Math.floor(Date.now() / 1000);
pm.environment.set('unix_timestamp', unixTimestamp);

// Custom format
const now = new Date();
const customDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
pm.environment.set('current_date', customDate);

console.log('Generated timestamps:', {
  current_timestamp: timestamp,
  iso_timestamp: isoTimestamp,
  unix_timestamp: unixTimestamp,
  custom_date: customDate
});
```

**Usage in Request:**
```json
{
  "createdAt": "{{iso_timestamp}}",
  "lastModified": {{current_timestamp}},
  "date": "{{current_date}}"
}
```

### 2. Generate UUID

```javascript
// Generate UUID v4 (random)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const orderId = generateUUID();
pm.environment.set('order_id', orderId);

console.log('Generated order_id:', orderId);
```

**Usage:**
```
POST /orders
Body:
{
  "orderId": "{{order_id}}",
  "items": [...]
}
```

### 3. Generate Random Data

```javascript
// Random number between min and max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random email
const randomEmail = `user${randomInt(1000, 9999)}@example.com`;
pm.environment.set('test_email', randomEmail);

// Random phone number
const randomPhone = `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`;
pm.environment.set('test_phone', randomPhone);

// Random string
function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const username = 'test_' + randomString(8);
pm.environment.set('test_username', username);

console.log('Generated test data:', {
  email: randomEmail,
  phone: randomPhone,
  username: username
});
```

### 4. Request Counter / Sequence Number

```javascript
// Get current counter (default to 0)
let counter = parseInt(pm.environment.get('request_counter') || '0');

// Increment
counter++;

// Save back
pm.environment.set('request_counter', counter);

// Use as sequence number
pm.environment.set('sequence_number', counter);

console.log(`Request #${counter}`);
```

**Usage:**
```json
{
  "sequenceNumber": {{sequence_number}},
  "batchId": "batch_{{sequence_number}}"
}
```

### 5. Base64 Encoding

```javascript
// Encode username:password for Basic Auth
const username = pm.environment.get('api_username');
const password = pm.environment.get('api_password');

const credentials = `${username}:${password}`;
const base64Credentials = btoa(credentials);

pm.environment.set('basic_auth_credentials', base64Credentials);

// Can also be used directly in headers
pm.request.headers.add({
  key: 'Authorization',
  value: `Basic ${base64Credentials}`
});
```

### 6. HMAC Signature for API Authentication

```javascript
// Example: AWS Signature-like HMAC-SHA256
const CryptoJS = require('crypto-js');

const apiKey = pm.environment.get('api_key');
const apiSecret = pm.environment.get('api_secret');
const timestamp = Date.now().toString();
const method = pm.request.method;
const path = pm.request.url.getPath();

// Create signature string
const signatureString = `${method}\n${path}\n${timestamp}`;

// Generate HMAC
const signature = CryptoJS.HmacSHA256(signatureString, apiSecret).toString();

// Set headers
pm.request.headers.add({
  key: 'X-API-Key',
  value: apiKey
});
pm.request.headers.add({
  key: 'X-Timestamp',
  value: timestamp
});
pm.request.headers.add({
  key: 'X-Signature',
  value: signature
});

console.log('Generated signature:', signature);
```

### 7. Token Expiration Check

```javascript
// Check if access token is expired
const tokenExpiresAt = pm.environment.get('token_expires_at');

if (!tokenExpiresAt) {
  console.log('⚠️ No token expiration time found');
} else {
  const expiresAt = new Date(tokenExpiresAt);
  const now = new Date();
  const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);
  
  console.log(`Token expires in ${minutesUntilExpiry} minutes`);
  
  if (minutesUntilExpiry < 5) {
    console.log('⚠️ Token expiring soon! Set flag to refresh.');
    pm.environment.set('should_refresh_token', 'true');
  } else {
    console.log('✅ Token is valid');
    pm.environment.unset('should_refresh_token');
  }
}
```

### 8. Conditional Request Modification

```javascript
// Different behavior based on environment
const env = pm.environment.name;

if (env === 'Production') {
  pm.request.url = pm.request.url.replace('http://', 'https://');
  console.log('✅ Using HTTPS for production');
} else {
  console.log('ℹ️ Using HTTP for development');
}

// Add debug headers in non-production
if (env !== 'Production') {
  pm.request.headers.add({
    key: 'X-Debug',
    value: 'true'
  });
}
```

### 9. Prepare File Upload Metadata

```javascript
// Generate file upload metadata
const fileName = pm.variables.get('upload_filename') || 'document.pdf';
const fileSize = pm.variables.get('upload_filesize') || 1024000; // 1MB default

const uploadMetadata = {
  fileName: fileName,
  fileSize: fileSize,
  uploadDate: new Date().toISOString(),
  checksum: 'abc123def456',  // Would be calculated from file
  mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
};

pm.environment.set('upload_metadata', JSON.stringify(uploadMetadata));

console.log('Upload metadata:', uploadMetadata);
```

### 10. Data Transformation

```javascript
// Transform data before sending
const rawData = pm.environment.get('raw_user_data');

if (rawData) {
  const userData = JSON.parse(rawData);
  
  // Transform: lowercase email, format phone
  userData.email = userData.email.toLowerCase();
  userData.phone = userData.phone.replace(/\D/g, ''); // Remove non-digits
  userData.fullName = `${userData.firstName} ${userData.lastName}`;
  
  // Store transformed data
  pm.environment.set('transformed_user_data', JSON.stringify(userData));
  
  console.log('Transformed user data:', userData);
}
```

---

## Real-World Examples

### Example 1: Create User with Dynamic Data

**Pre-request Script:**
```javascript
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate unique user data
const userId = randomInt(10000, 99999);
const timestamp = Date.now();

const testUser = {
  userId: userId,
  username: `user_${userId}`,
  email: `user${userId}@test.com`,
  firstName: 'Test',
  lastName: `User${userId}`,
  createdAt: new Date().toISOString()
};

// Store for use in request and tests
pm.environment.set('test_user_id', testUser.userId);
pm.environment.set('test_username', testUser.username);
pm.environment.set('test_user_email', testUser.email);
pm.environment.set('test_user_json', JSON.stringify(testUser));

console.log('Created test user:', testUser);
```

**Request Body:**
```json
{
  "userId": {{test_user_id}},
  "username": "{{test_username}}",
  "email": "{{test_user_email}}",
  "firstName": "Test",
  "lastName": "User{{test_user_id}}"
}
```

### Example 2: Collection-level Authentication

**Collection Pre-request Script:**
```javascript
// Check if we have a valid access token
const accessToken = pm.environment.get('access_token');
const tokenExpiresAt = pm.environment.get('token_expires_at');

// If no token or expired, need to authenticate
if (!accessToken || !tokenExpiresAt || new Date(tokenExpiresAt) < new Date()) {
  console.log('No valid token found. Authentication required.');
  pm.environment.set('needs_authentication', 'true');
} else {
  console.log('✅ Valid token found');
  pm.environment.unset('needs_authentication');
}

// Add authorization header if we have a token
if (accessToken) {
  pm.request.headers.add({
    key: 'Authorization',
    value: `Bearer ${accessToken}`
  });
}
```

### Example 3: API Rate Limiting

**Collection Pre-request Script:**
```javascript
// Simple rate limiter: max 10 requests per second
const lastRequestTime = pm.environment.get('last_request_time');
const now = Date.now();

if (lastRequestTime) {
  const timeSinceLastRequest = now - parseInt(lastRequestTime);
  const minDelay = 100; // 100ms = 10 requests/second max
  
  if (timeSinceLastRequest < minDelay) {
    const waitTime = minDelay - timeSinceLastRequest;
    console.log(`⏱️ Rate limit: waiting ${waitTime}ms`);
    // Note: Can't actually delay in pre-request, but can log
  }
}

pm.environment.set('last_request_time', now.toString());
```

---

## Debugging Pre-request Scripts

### Console Logging

```javascript
console.log('Simple message');
console.log('Variable value:', pm.environment.get('my_var'));
console.log('Object:', { key: 'value', number: 123 });

// Check script execution
console.log('=== PRE-REQUEST SCRIPT START ===');
// ... your code ...
console.log('=== PRE-REQUEST SCRIPT END ===');
```

**View logs:** Open **Console** tab at bottom of Simba window

### Variable Inspection

```javascript
// List all environment variables
const envVars = pm.environment.toObject();
console.log('Environment variables:', envVars);

// Check if variable exists
const myVar = pm.environment.get('my_var');
if (myVar === undefined) {
  console.log('⚠️ Variable "my_var" not found');
} else {
  console.log('✅ Variable "my_var":', myVar);
}
```

### Error Handling

```javascript
try {
  const data = JSON.parse(pm.environment.get('json_data'));
  console.log('Parsed data:', data);
} catch (error) {
  console.error('❌ Failed to parse JSON:', error.message);
  // Set a fallback
  pm.environment.set('json_data', JSON.stringify({ default: true }));
}
```

---

## Best Practices

### ✅ DO:
- **Use environment variables** for dynamic values that change across environments
- **Keep scripts focused**: One responsibility per script
- **Log important steps**: Use `console.log()` for debugging
- **Handle errors**: Wrap risky operations in try-catch
- **Comment your code**: Explain complex logic
- **Test scripts independently**: Use console to verify logic
- **Reuse functions**: Define helper functions for common tasks

### ❌ DON'T:
- **Don't make HTTP requests**: Pre-request scripts can't make external API calls
- **Don't assume variables exist**: Always check for undefined
- **Don't hardcode secrets**: Use environment variables
- **Don't write overly complex scripts**: Keep it simple and readable
- **Don't forget to save**: Scripts are saved with the request
- **Don't mix concerns**: Separate authentication, data generation, validation

---

## Common Patterns

### Pattern 1: Reusable Helper Functions

**Collection Pre-request:**
```javascript
// Define reusable functions
pm.environment.set('utils_loaded', 'true');

// These functions can be used in request pre-request scripts
```

**Request Pre-request:**
```javascript
// Reuse collection-level utilities
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const id = generateUUID();
pm.environment.set('request_id', id);
```

### Pattern 2: Chain Requests with Variables

**Request 1 (Create User):**
```javascript
// Pre-request: Generate user
const userId = Date.now();
pm.environment.set('new_user_id', userId);
```

**Request 2 (Get User):**
```javascript
// URL: GET /users/{{new_user_id}}
// Pre-request: Verify user ID exists
const userId = pm.environment.get('new_user_id');
if (!userId) {
  console.error('❌ No user ID found. Run "Create User" first.');
}
```

### Pattern 3: Environment-specific Configuration

**Collection Pre-request:**
```javascript
const env = pm.environment.name;

const config = {
  'Development': {
    baseUrl: 'http://localhost:5000',
    debug: true,
    timeout: 30000
  },
  'Staging': {
    baseUrl: 'https://staging.api.example.com',
    debug: true,
    timeout: 15000
  },
  'Production': {
    baseUrl: 'https://api.example.com',
    debug: false,
    timeout: 10000
  }
};

const currentConfig = config[env] || config['Development'];
pm.environment.set('base_url', currentConfig.baseUrl);
pm.environment.set('debug_mode', currentConfig.debug.toString());

console.log(`📍 Using ${env} configuration:`, currentConfig);
```

---

## Troubleshooting

### Script Not Executing

**Check:**
1. Script is saved with the request/collection
2. No JavaScript syntax errors (check Console for errors)
3. Script tab is the correct one (Pre-request, not Test)
4. Collection/folder scripts run before request scripts

### Variables Not Updating

**Check:**
1. Using correct `pm.environment.set()` syntax
2. Variable name matches exactly (case-sensitive)
3. Environment is active (check dropdown)
4. Viewing correct environment's variables

### `undefined` Errors

**Solution:**
```javascript
// Always check before using
const myVar = pm.environment.get('my_var');
if (myVar === undefined) {
  console.log('Variable not found, using default');
  pm.environment.set('my_var', 'default_value');
}
```

---

## Related Topics

- [Test Scripts](test-scripts.md) - Write post-request validations
- [Scripting API Reference](../reference/scripting-api.md) - Complete API documentation
- [Environment Variables](../core-concepts/variables.md) - Managing variables
- [Collection Runner](collection-runner.md) - Run multiple requests with scripts
- [Automated Testing Tutorial](../tutorials/automated-testing.md) - Build test suites
