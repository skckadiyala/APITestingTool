# Variables

**Variables** are dynamic placeholders that store values you can reuse across requests, scripts, and collections. They use the `{{variableName}}` syntax and make your API tests flexible and maintainable.

## What are Variables?

Variables are key-value pairs that can be used anywhere in Simba:

- Request URLs
- Headers
- Query parameters
- Request body
- Scripts
- Authentication

![Variable Usage](../assets/screenshots/variable-syntax-example.png)

**Example**:
```
URL: {{baseUrl}}/users/{{userId}}
Header: Authorization: Bearer {{authToken}}
Body: { "key": "{{apiKey}}" }
```

When executed, Simba replaces `{{variables}}` with their actual values.

---

## Variable Scopes

Simba has three variable scopes with different priorities:

### 1. Environment Variables

**Scope**: Environment-specific (Dev, Staging, Production)  
**Priority**: Highest  
**Use for**: Values that change between environments

```json
{
  "baseUrl": "https://api-dev.example.com",
  "apiKey": "dev_key_12345",
  "timeout": "5000"
}
```

[Learn more about environments →](environments.md)

### 2. Collection Variables

**Scope**: Collection-specific (all requests in a collection)  
**Priority**: Medium  
**Use for**: Collection-wide constants

```json
{
  "apiVersion": "v2",
  "defaultLimit": "10",
  "contentType": "application/json"
}
```

[Learn more about collections →](collections.md)

### 3. Global Variables

**Scope**: Workspace-wide (available everywhere)  
**Priority**: Lowest  
**Use for**: Truly global values

```json
{
  "workspaceId": "12345",
  "timestamp": "1704398400000"
}
```

### Variable Resolution Order

When Simba encounters `{{variableName}}`, it searches in this order:

```
1. Environment Variables (highest priority)
   ↓ if not found
2. Collection Variables
   ↓ if not found
3. Global Variables (lowest priority)
   ↓ if not found
4. {{variableName}} (left as-is)
```

**Example**:

```javascript
// Environment has: userId = "123"
// Collection has: userId = "456"
// Global has: userId = "789"

{{userId}}  // Resolves to "123" (environment wins)
```

---

## Variable Syntax

### Basic Usage

Use double curly braces `{{variableName}}`:

```
{{baseUrl}}
{{apiKey}}
{{userId}}
{{timestamp}}
```

### In Different Contexts

**URL**:
```
GET {{baseUrl}}/api/v{{apiVersion}}/users/{{userId}}
```

**Headers**:
```
Authorization: Bearer {{authToken}}
X-API-Key: {{apiKey}}
X-Request-ID: {{requestId}}
```

**Query Parameters**:
```
?api_key={{apiKey}}&page={{page}}&limit={{limit}}
```

**Request Body** (JSON):
```json
{
  "username": "{{username}}",
  "email": "{{email}}",
  "apiKey": "{{apiKey}}",
  "timestamp": {{timestamp}}
}
```

**Request Body** (Form Data):
```
Key: api_key
Value: {{apiKey}}
```

### Multiple Variables

Use multiple variables in one string:

```
{{protocol}}://{{host}}:{{port}}/{{path}}

// Resolves to:
https://api.example.com:443/v1/users
```

### Nested Paths

Variables resolve to complete values (no nesting):

```
✅ {{baseUrl}}/users
✅ {{protocol}}://{{host}}

❌ {{base{{env}}Url}}  // Nesting not supported
```

---

## Setting Variables

### In Environment/Collection Editor

**Environment Variables**:
1. Click **Environment dropdown** → **⚙️ Edit**
2. Add variable:
   - Key: `baseUrl`
   - Value: `https://api.example.com`
3. Click **Save**

**Collection Variables**:
1. Right-click collection → **Collection Settings**
2. Go to **Variables** tab
3. Add variable
4. Click **Save**

### In Scripts

Variables can be set dynamically in pre-request and test scripts.

**Environment Variables**:
```javascript
// Set
pm.environment.set('variableName', 'value');

// Get
const value = pm.environment.get('variableName');

// Remove
pm.environment.unset('variableName');

// Check existence
if (pm.environment.has('variableName')) {
    // Variable exists
}
```

**Collection Variables**:
```javascript
// Set
pm.collectionVariables.set('variableName', 'value');

// Get
const value = pm.collectionVariables.get('variableName');

// Remove
pm.collectionVariables.unset('variableName');
```

**Global Variables**:
```javascript
// Set
pm.globals.set('variableName', 'value');

// Get
const value = pm.globals.get('variableName');

// Remove
pm.globals.unset('variableName');
```

**Dynamic Variables (during script execution)**:
```javascript
// Set temporary variable (highest priority)
pm.variables.set('tempVar', 'value');

// Get with fallback
const value = pm.variables.get('variableName'); // Checks all scopes
```

---

## Common Use Cases

### 1. Dynamic Authentication

**Pre-Request Script** (Login request):
```javascript
// Request body has username/password
// Response contains token
```

**Test Script** (Login request):
```javascript
// Extract token from response
const response = pm.response.json();
pm.environment.set('authToken', response.access_token);
pm.environment.set('refreshToken', response.refresh_token);

console.log('Token saved for subsequent requests');
```

**Next Request** (Get User):
```
GET {{baseUrl}}/users/me
Authorization: Bearer {{authToken}}
```

### 2. Request Chaining

Extract data from one response to use in the next request.

**Request 1: Create User**
```javascript
// Test Script
const user = pm.response.json();
pm.environment.set('userId', user.id);
pm.environment.set('userEmail', user.email);
```

**Request 2: Get User Details**
```
GET {{baseUrl}}/users/{{userId}}
```

**Request 3: Update User**
```
PUT {{baseUrl}}/users/{{userId}}
Body: { "email": "{{userEmail}}" }
```

### 3. Timestamps and Random Data

**Pre-Request Script**:
```javascript
// Current timestamp
pm.environment.set('timestamp', Date.now());

// ISO date string
pm.environment.set('isoDate', new Date().toISOString());

// Random string
pm.environment.set('randomId', Math.random().toString(36).substring(7));

// Random number
pm.environment.set('randomNum', Math.floor(Math.random() * 1000));

// UUID (simple version)
pm.environment.set('uuid', 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    })
);
```

**Usage**:
```json
{
  "id": "{{uuid}}",
  "timestamp": {{timestamp}},
  "createdAt": "{{isoDate}}",
  "key": "{{randomId}}"
}
```

### 4. Computed Values

Calculate values based on other variables:

**Pre-Request Script**:
```javascript
const basePrice = pm.collectionVariables.get('basePrice');
const taxRate = pm.environment.get('taxRate');
const total = basePrice * (1 + taxRate);

pm.variables.set('totalPrice', total);
```

**Request Body**:
```json
{
  "basePrice": {{basePrice}},
  "taxRate": {{taxRate}},
  "total": {{totalPrice}}
}
```

### 5. Conditional Variables

Set variables based on conditions:

**Pre-Request Script**:
```javascript
const env = pm.environment.name;

if (env === 'Production') {
    pm.variables.set('logLevel', 'error');
    pm.variables.set('timeout', 30000);
} else {
    pm.variables.set('logLevel', 'debug');
    pm.variables.set('timeout', 5000);
}
```

### 6. Counter Variables

Track iterations or counts:

**Test Script**:
```javascript
// Increment counter
let count = pm.collectionVariables.get('requestCount') || 0;
count++;
pm.collectionVariables.set('requestCount', count);

console.log(`Request #${count} completed`);
```

---

## Built-in Dynamic Variables

Simba provides special variables that generate values automatically:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{$timestamp}}` | Current Unix timestamp (seconds) | `1704398400` |
| `{{$isoTimestamp}}` | Current ISO 8601 timestamp | `2024-01-15T12:00:00.000Z` |
| `{{$randomInt}}` | Random integer (0-1000) | `742` |
| `{{$guid}}` | Random GUID/UUID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `{{$randomAlphaNumeric}}` | Random alphanumeric string (8 chars) | `aB3xQ9tL` |

**Usage**:
```json
{
  "id": "{{$guid}}",
  "timestamp": {{$timestamp}},
  "createdAt": "{{$isoTimestamp}}",
  "code": "{{$randomAlphaNumeric}}"
}
```

!!! tip "Regeneration"
    Dynamic variables generate new values each time the request is sent.

---

## Variable Management

### Viewing Variables

**Quick Look**:
- Hover over `{{variable}}` in editor to see its value
- Click 👁️ icon in environment dropdown

**Environment Editor**:
- See all environment variables with values
- Edit, add, or remove variables

**Console**:
```javascript
// List all environment variables
console.log('Environment:', pm.environment.toObject());

// List all collection variables
console.log('Collection:', pm.collectionVariables.toObject());

// List all global variables
console.log('Global:', pm.globals.toObject());
```

### Clearing Variables

**Clear all environment variables**:
```javascript
pm.environment.clear();
```

**Clear all collection variables**:
```javascript
pm.collectionVariables.clear();
```

**Clear specific variables**:
```javascript
pm.environment.unset('authToken');
pm.environment.unset('userId');
pm.collectionVariables.unset('tempData');
```

### Bulk Operations

**Set multiple variables**:
```javascript
const variables = {
    'baseUrl': 'https://api.example.com',
    'apiKey': 'key_12345',
    'timeout': 5000
};

Object.entries(variables).forEach(([key, value]) => {
    pm.environment.set(key, value);
});
```

**Copy variables between scopes**:
```javascript
// Copy from environment to collection
const authToken = pm.environment.get('authToken');
pm.collectionVariables.set('authToken', authToken);
```

---

## Best Practices

### Naming Conventions

Use descriptive, consistent names:

✅ **Good**:
```
baseUrl
authToken
userId
apiKey
requestTimeout
```

❌ **Bad**:
```
url
token
id
key
timeout
```

**Conventions**:
- Use camelCase: `userName`, `apiKey`, `authToken`
- Be descriptive: `userAuthToken` not `token`
- Use prefixes for related vars: `api_key`, `api_version`, `api_timeout`

### Variable Organization

**Environment Variables** (change per environment):
- URLs and endpoints
- API keys and credentials
- Environment-specific settings
- Database connection strings

**Collection Variables** (constant per collection):
- API versions
- Default values
- Configuration constants
- Schema definitions

**Global Variables** (truly global):
- Workspace-wide settings
- Shared utilities
- Cross-collection data

### Security

Protect sensitive data:

✅ **Do**:
- Use environment variables for secrets
- Use "Current Value" for sensitive data (not shared)
- Clear sensitive variables after use
- Don't log secrets to console

❌ **Don't**:
- Hardcode credentials in requests
- Store production secrets in "Initial Value"
- Commit sensitive variables to version control
- Share environments with secrets

**Example**:
```javascript
// ✅ Clear secret after use
pm.test("Store temporary token", function() {
    const token = pm.response.json().token;
    pm.variables.set('tempToken', token); // Only for this execution
});

// Later in test script
pm.variables.unset('tempToken'); // Clear immediately
```

### Documentation

Document variables in environment/collection descriptions:

```json
{
  "name": "Development",
  "description": "Local development environment",
  "variables": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "description": "API base URL for all endpoints"
    },
    {
      "key": "apiKey",
      "value": "dev_key_12345",
      "description": "Development API key (rotate monthly)"
    }
  ]
}
```

### Error Handling

Handle missing variables gracefully:

```javascript
// Check before using
if (pm.environment.has('authToken')) {
    const token = pm.environment.get('authToken');
    // Use token
} else {
    console.error('Auth token not found. Please run login request first.');
}

// Provide defaults
const timeout = pm.environment.get('timeout') || 5000;
const limit = pm.variables.get('limit') || 10;

// Validate values
const apiKey = pm.environment.get('apiKey');
if (!apiKey || apiKey === '') {
    throw new Error('API key is required');
}
```

---

## Debugging Variables

### View Current Values

**In Console**:
```javascript
console.log('Variable resolution:');
console.log('Environment:', pm.environment.get('userId'));
console.log('Collection:', pm.collectionVariables.get('userId'));
console.log('Global:', pm.globals.get('userId'));
console.log('Resolved:', pm.variables.get('userId')); // Final value
```

**In Test Script**:
```javascript
pm.test("Check variable values", function() {
    console.log('All environment vars:', pm.environment.toObject());
    console.log('All collection vars:', pm.collectionVariables.toObject());
    console.log('Active environment:', pm.environment.name);
});
```

### Common Issues

**Variable not resolving**:
```javascript
// Check if variable exists
if (!pm.variables.get('baseUrl')) {
    console.error('baseUrl not set in any scope');
}

// Check specific scope
if (!pm.environment.has('apiKey')) {
    console.warn('apiKey not in environment');
}
```

**Wrong value being used**:
```javascript
// Check resolution order
const value = pm.variables.get('userId');
console.log('Resolved userId:', value);
console.log('From environment?', pm.environment.get('userId') === value);
console.log('From collection?', pm.collectionVariables.get('userId') === value);
```

**Variable not updating**:
```javascript
// Verify it's being set
pm.environment.set('authToken', newToken);
console.log('Token after set:', pm.environment.get('authToken'));

// Check if it persists
pm.test("Variable persists", function() {
    pm.expect(pm.environment.get('authToken')).to.equal(newToken);
});
```

---

## Advanced Techniques

### Variable Chaining

Use variables to build complex URLs:

```javascript
// Set parts
pm.environment.set('protocol', 'https');
pm.environment.set('subdomain', 'api');
pm.environment.set('domain', 'example.com');
pm.environment.set('port', '443');
pm.environment.set('path', 'v2/users');

// In request URL
{{protocol}}://{{subdomain}}.{{domain}}:{{port}}/{{path}}
// Resolves to: https://api.example.com:443/v2/users
```

### Variable Transformations

Transform variables before use:

```javascript
// Uppercase
const username = pm.environment.get('username');
pm.variables.set('usernameUpper', username.toUpperCase());

// Encode for URL
const searchTerm = pm.environment.get('search');
pm.variables.set('searchEncoded', encodeURIComponent(searchTerm));

// Hash for signatures
const data = pm.environment.get('data');
// Use crypto library to hash
pm.variables.set('dataHash', hashFunction(data));
```

### Variable Arrays

Store arrays as JSON strings:

```javascript
// Set array
const userIds = [1, 2, 3, 4, 5];
pm.environment.set('userIds', JSON.stringify(userIds));

// Get array
const userIds = JSON.parse(pm.environment.get('userIds'));
userIds.forEach(id => {
    console.log('User ID:', id);
});
```

### Variable Objects

Store complex objects:

```javascript
// Set object
const config = {
    apiKey: 'key_12345',
    timeout: 5000,
    retries: 3
};
pm.collectionVariables.set('config', JSON.stringify(config));

// Get object
const config = JSON.parse(pm.collectionVariables.get('config'));
console.log('API Key:', config.apiKey);
console.log('Timeout:', config.timeout);
```

---

## Related Topics

<div class="grid cards" markdown>

-   :material-earth:{ .lg .middle } **Environments**

    ---

    Manage environment variables for different stages

    [:octicons-arrow-right-24: Environments Guide](environments.md)

-   :material-folder:{ .lg .middle } **Collections**

    ---

    Use collection variables in your requests

    [:octicons-arrow-right-24: Collections Guide](collections.md)

-   :material-code-braces:{ .lg .middle } **Scripting API**

    ---

    Complete pm.* API for working with variables

    [:octicons-arrow-right-24: Scripting API Reference](../reference/scripting-api.md)

</div>

---

## Frequently Asked Questions

??? question "Can variables reference other variables?"
    No, variable nesting like `{{base{{env}}Url}}` is not supported. Each variable resolves independently.

??? question "What happens if a variable isn't found?"
    The `{{variableName}}` placeholder remains as-is in the request, which usually causes the request to fail.

??? question "Can I use variables in scripts?"
    Yes, use `pm.environment.get()`, `pm.collectionVariables.get()`, or `pm.variables.get()`.

??? question "How do I see which value will be used?"
    Hover over `{{variable}}` in the editor to see the resolved value and source scope.

??? question "Are variables case-sensitive?"
    Yes, `{{userId}}` and `{{UserId}}` are different variables.

??? question "Can I use special characters in variable names?"
    Variable names should use alphanumeric characters and underscores. Avoid spaces and special characters.

??? question "Do variables persist between sessions?"
    Environment and collection variables persist. Variables set with `pm.variables.set()` are temporary (execution-only).

??? question "Can I export variables?"
    Yes, environment and collection variables are exported. Current Values (secrets) are not exported.
