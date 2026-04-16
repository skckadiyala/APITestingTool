# Environments

**Environments** are named sets of variables that represent different stages of your API (Development, Staging, Production). They allow you to switch between contexts without changing your requests.

## What is an Environment?

An environment is a collection of key-value pairs (variables) that represent a specific context:

![Environment Concept](../assets/screenshots/environment-concept.png)

**Example: Development Environment**
```json
{
  "name": "Development",
  "variables": [
    { "key": "baseUrl", "value": "http://localhost:3000" },
    { "key": "apiKey", "value": "dev_key_12345" },
    { "key": "timeout", "value": "5000" }
  ]
}
```

**Example: Production Environment**
```json
{
  "name": "Production",
  "variables": [
    { "key": "baseUrl", "value": "https://api.example.com" },
    { "key": "apiKey", "value": "prod_key_98765" },
    { "key": "timeout", "value": "30000" }
  ]
}
```

**Same request works in both**:
```
GET {{baseUrl}}/api/users
Headers:
  X-API-Key: {{apiKey}}
```

---

## Why Use Environments?

### Switch Contexts Easily
Test the same requests across Development, Staging, and Production without editing URLs or credentials.

### Prevent Mistakes
Avoid accidentally hitting production APIs during development.

### Share Safely
Share collections with colleagues without exposing production credentials (use environment-specific values).

### Manage Complexity
Handle different URLs, ports, API keys, and configurations per environment.

---

## Creating an Environment

### From Environment Selector

![Create Environment](../assets/screenshots/environment-create-dialog.png)

**To create an environment:**

1. Click **Environment dropdown** (top center)
2. Select **+ Create Environment**
3. Fill in the form:
   - **Name**: e.g., "Development"
   - **Description** (optional): "Local development environment"
4. Click **Create**

The new environment appears in the dropdown.

### Adding Variables

![Environment Variables Editor](../assets/screenshots/environment-variables-editor.png)

**To add variables:**

1. Select the environment from dropdown
2. Click **⚙️ Edit** icon
3. Add variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `apiKey` | `dev_api_key_12345` | `dev_api_key_12345` |
| `username` | `testuser` | `testuser` |
| `timeout` | `5000` | `5000` |

4. Click **Save**

!!! tip "Initial vs Current Value"
    - **Initial Value**: Checked into version control, shared with team
    - **Current Value**: Local only, not shared (for temporary overrides)

---

## Managing Environments

### Switching Environments

![Environment Selector](../assets/screenshots/environment-selector.png)

**To switch environments:**

1. Click **Environment dropdown** (top center)
2. Select the environment to activate

**Visual indicator**: Active environment name appears in the dropdown.

When you switch:
- ✅ All requests use the new environment's variables
- ✅ `{{variable}}` placeholders are resolved from the selected environment
- ✅ Previous environment is deactivated

### No Environment

Select **No Environment** to:
- Use only collection and global variables
- Test without environment-specific values
- Debug variable resolution issues

### Environment Quick Look

![Environment Quick Look](../assets/screenshots/environment-quick-look.png)

Hover over the **👁️ Quick Look** icon to see all variables in the active environment without opening the editor.

---

## Setting Up Common Environments

### Development Environment

For local development and testing:

```json
{
  "name": "Development",
  "variables": [
    { "key": "baseUrl", "value": "http://localhost:3000" },
    { "key": "apiKey", "value": "dev_key" },
    { "key": "dbName", "value": "test_db" },
    { "key": "logLevel", "value": "debug" },
    { "key": "timeout", "value": "5000" }
  ]
}
```

**Characteristics**:
- Points to localhost
- Uses test credentials
- Short timeouts for fast feedback
- Debug logging enabled

### Staging Environment

For pre-production testing:

```json
{
  "name": "Staging",
  "variables": [
    { "key": "baseUrl", "value": "https://staging-api.example.com" },
    { "key": "apiKey", "value": "staging_key" },
    { "key": "dbName", "value": "staging_db" },
    { "key": "logLevel", "value": "info" },
    { "key": "timeout", "value": "10000" }
  ]
}
```

**Characteristics**:
- Points to staging server
- Uses staging credentials
- Medium timeouts
- Info-level logging

### Production Environment

For live API testing:

```json
{
  "name": "Production",
  "variables": [
    { "key": "baseUrl", "value": "https://api.example.com" },
    { "key": "apiKey", "value": "prod_key" },
    { "key": "dbName", "value": "prod_db" },
    { "key": "logLevel", "value": "error" },
    { "key": "timeout", "value": "30000" }
  ]
}
```

**Characteristics**:
- Points to production server
- Uses production credentials
- Long timeouts for reliability
- Error-only logging

!!! danger "Production Safety"
    Be extremely careful when testing against production. Consider:
    - Read-only requests (GET) only
    - Test data that can be safely deleted
    - Rate limiting considerations
    - Backup before destructive operations

---

## Using Environment Variables

### In Request URL

```
GET {{baseUrl}}/api/users/{{userId}}
```

Simba replaces `{{baseUrl}}` and `{{userId}}` with values from the active environment.

### In Headers

```
Headers:
  Authorization: Bearer {{authToken}}
  X-API-Key: {{apiKey}}
  X-Environment: {{environmentName}}
```

### In Request Body

```json
{
  "username": "{{testUsername}}",
  "email": "{{testEmail}}",
  "apiKey": "{{apiKey}}"
}
```

### In Query Parameters

```
?api_key={{apiKey}}&limit={{defaultLimit}}&page={{currentPage}}
```

### In Scripts

**Pre-Request Script**:
```javascript
// Get variable
const baseUrl = pm.environment.get('baseUrl');
console.log('Testing against:', baseUrl);

// Set variable
pm.environment.set('timestamp', Date.now());
```

**Test Script**:
```javascript
// Extract from response and save
const token = pm.response.json().token;
pm.environment.set('authToken', token);

// Use in next request
const userId = pm.response.json().userId;
pm.environment.set('testUserId', userId);
```

[Learn more about variable syntax →](variables.md)

---

## Environment Variables Management

### Updating Variables

**In Environment Editor**:
1. Click Environment dropdown → **⚙️ Edit**
2. Modify variable values
3. Click **Save**

**In Scripts**:
```javascript
// Update existing variable
pm.environment.set('authToken', newToken);

// Remove variable
pm.environment.unset('oldVariable');
```

### Sensitive Variables

For secrets (passwords, API keys):

**Best Practices**:
- ✅ Use Current Value (not shared)
- ✅ Don't commit to version control
- ✅ Use environment-specific secrets
- ✅ Rotate regularly

**In Environment Editor**:

| Variable | Initial Value | Current Value | Type |
|----------|---------------|---------------|------|
| `apiKey` | (empty) | `actual_secret_key` | secret |

**Current Value** is used but not exported or shared.

!!! warning "Security"
    Never commit production credentials to version control. Use Current Values or external secret managers.

### Variable Types

| Type | Usage | Example |
|------|-------|---------|
| **String** | URLs, names | `https://api.example.com` |
| **Number** | IDs, ports | `3000` |
| **Boolean** | Flags | `true` |
| **Secret** | Passwords, keys | `•••••••` |

Secret variables are masked in the UI and not exported.

---

## Duplicating Environments

Create similar environments quickly:

**To duplicate an environment:**

1. Select environment to duplicate
2. Click **⚙️ Edit** → **⋮ More** → **Duplicate**
3. Enter new name: e.g., "Development (Backup)"
4. Modify variables as needed
5. Click **Save**

**Use cases**:
- Create Staging from Production (with different URLs)
- Create personal dev environment from team dev environment
- Backup before major changes

---

## Exporting and Importing Environments

### Exporting

**To export an environment:**

1. Select environment
2. Click **⚙️ Edit** → **⋮ More** → **Export**
3. Save JSON file

**Export includes**:
- Environment name
- Initial values (not current values)
- Variable descriptions

**Export excludes**:
- Current values (for security)
- Sensitive secrets

### Importing

**To import an environment:**

1. Click **Import** button (top bar)
2. Select **Environment**
3. Upload JSON file
4. Click **Import**

!!! tip "Sharing Environments"
    Export environments to share with team members. They'll need to add their own secrets in Current Value.

---

## Environment Variables vs. Collection Variables

### When to Use Environment Variables

Use **Environment Variables** for:
- ✅ Values that change between Dev/Staging/Prod
- ✅ API endpoints and URLs
- ✅ Authentication tokens
- ✅ Database names
- ✅ Feature flags per environment

**Example**:
```json
{
  "baseUrl": "https://staging-api.example.com",
  "apiKey": "staging_key_12345",
  "dbName": "staging_db"
}
```

### When to Use Collection Variables

Use **Collection Variables** for:
- ✅ Values that don't change between environments
- ✅ API-specific constants
- ✅ Default values
- ✅ Temporary values during collection runs

**Example**:
```json
{
  "apiVersion": "v2",
  "defaultLimit": "10",
  "contentType": "application/json"
}
```

### Variable Priority

Variables are resolved in this order (highest to lowest):

1. **Environment Variables** (highest)
2. **Collection Variables**
3. **Global Variables** (lowest)

If `{{userId}}` exists in both environment and collection, environment value wins.

---

## Best Practices

### Naming Conventions

Use clear, descriptive names:

✅ **Good**:
```
baseUrl
authToken
apiKey
databaseHost
maxRetries
```

❌ **Bad**:
```
url
token
key
host
max
```

### Consistent Structure

Keep the same variables across all environments:

**Development**:
```json
{ "baseUrl": "http://localhost:3000", "apiKey": "dev_key" }
```

**Staging**:
```json
{ "baseUrl": "https://staging.api.com", "apiKey": "stg_key" }
```

**Production**:
```json
{ "baseUrl": "https://api.com", "apiKey": "prod_key" }
```

All have `baseUrl` and `apiKey` - only values differ.

### Security

Protect sensitive data:

✅ **Do**:
- Use Current Value for secrets
- Don't commit secrets to version control
- Rotate credentials regularly
- Use different keys per environment
- Limit who can access production environments

❌ **Don't**:
- Store passwords in Initial Value
- Share production credentials in exported files
- Use the same API key across environments
- Leave credentials in exported collections

### Documentation

Document your variables:

```json
[
  {
    "key": "baseUrl",
    "value": "http://localhost:3000",
    "description": "API base URL for all endpoints"
  },
  {
    "key": "apiKey",
    "value": "dev_key_12345",
    "description": "API authentication key (rotate monthly)"
  },
  {
    "key": "timeout",
    "value": "5000",
    "description": "Request timeout in milliseconds"
  }
]
```

---

## Advanced Usage

### Dynamic Variables

Set variables dynamically in scripts:

**Pre-Request Script**:
```javascript
// Generate timestamp
pm.environment.set('timestamp', Date.now());

// Generate random ID
pm.environment.set('requestId', Math.random().toString(36).substring(7));

// Calculate auth signature
const signature = calculateSignature(pm.environment.get('apiKey'));
pm.environment.set('authSignature', signature);
```

### Chaining Requests

Pass data between requests using environment variables:

**Request 1: Login**
```javascript
// Test Script
const response = pm.response.json();
pm.environment.set('authToken', response.token);
pm.environment.set('userId', response.user.id);
```

**Request 2: Get User Profile**
```
GET {{baseUrl}}/users/{{userId}}
Authorization: Bearer {{authToken}}
```

### Conditional Logic

Use environment-specific logic:

```javascript
const env = pm.environment.name;

if (env === 'Production') {
    // Production-only checks
    pm.test("Response under 100ms", function() {
        pm.expect(pm.response.responseTime).to.be.below(100);
    });
} else {
    // Dev/Staging: Detailed debug info
    console.log('Full response:', pm.response.json());
}
```

---

## Related Topics

<div class="grid cards" markdown>

-   :material-variable:{ .lg .middle } **Variables**

    ---

    Complete guide to variable types and usage

    [:octicons-arrow-right-24: Variables Guide](variables.md)

-   :material-folder:{ .lg .middle } **Collections**

    ---

    Use collection variables alongside environments

    [:octicons-arrow-right-24: Collections Guide](collections.md)

-   :material-code-braces:{ .lg .middle } **Scripting**

    ---

    Set and get variables programmatically

    [:octicons-arrow-right-24: Scripting API Reference](../reference/scripting-api.md)

</div>

---

## Frequently Asked Questions

??? question "How many environments can I create?"
    There's no limit. Create as many as you need for different stages or configurations.

??? question "Can I have an environment active in multiple workspaces?"
    No, environments are workspace-scoped. Each workspace has its own environments.

??? question "What happens if I delete an active environment?"
    Simba switches to "No Environment" and requests will fail if they depend on environment variables.

??? question "Can team members see my Current Values?"
    No, Current Values are local to your machine and never shared or exported.

??? question "How do I share environments with my team?"
    Environments are shared automatically within a workspace. All members can see and use them (based on permissions).

??? question "Can I version control environments?"
    Yes, export environments as JSON and commit to git. Don't commit secrets (use Current Values).

??? question "What's the difference between Initial and Current Value?"
    Initial Value is shared/exported, Current Value is local and not shared (use for secrets).

??? question "Can I use environment variables in another environment's variables?"
    No, variable nesting is not supported. Each variable is independent.
