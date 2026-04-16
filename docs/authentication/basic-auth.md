# Basic Authentication

Basic authentication is a simple authentication scheme built into HTTP. It sends a username and password encoded in Base64 with each request.

---

## Overview

Basic Auth:
- **Simple**: Built into HTTP protocol, widely supported
- **Stateless**: No session management required
- **Base64 Encoded**: Credentials are encoded but **not encrypted**
- **Legacy-friendly**: Supported by all HTTP clients since HTTP/1.0

⚠️ **Security Warning**: Basic Auth sends credentials with every request. Always use HTTPS to protect credentials in transit.

Common use cases:
- Legacy APIs without token support
- Internal tools and admin panels
- Development/testing environments
- Simple authentication for low-risk applications
- Server-to-server communication with HTTPS

---

## How It Works

1. Client sends request with `Authorization` header
2. Header contains: `Basic <Base64(username:password)>`
3. Server decodes credentials and validates
4. If valid, server processes request; if invalid, returns 401

Example header:
```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

Decoded: `username:password` → `dXNlcm5hbWU6cGFzc3dvcmQ=`

---

## Setting Up Basic Auth in Simba

### 1. Configure in Request

![Basic Auth Configuration](../assets/screenshots/auth-basic-config.png)

1. Open your request in the Request Builder
2. Go to the **Auth** tab
3. Select **Basic Auth** from the dropdown
4. Enter **Username** and **Password**

Simba automatically:
- Encodes credentials to Base64
- Adds the `Authorization: Basic ...` header
- Sends credentials with each request

### 2. Using Environment Variables (Recommended)

**Environment Setup:**
```json
{
  "name": "Test Environment",
  "variables": [
    {
      "key": "api_username",
      "value": "test_user",
      "enabled": true
    },
    {
      "key": "api_password",
      "value": "SecurePassword123!",
      "enabled": true
    }
  ]
}
```

**Request Configuration:**
- Username: `{{api_username}}`
- Password: `{{api_password}}`

Benefits:
- ✅ Keep credentials out of requests
- ✅ Easy environment switching (Dev/Test/Prod)
- ✅ Share collections without exposing passwords
- ✅ Update credentials in one place

---

## Real-World Example: JSONPlaceholder API

JSONPlaceholder doesn't require auth, but let's simulate it for demonstration:

### Example 1: Simple GET Request

**Create Request:**
```
Method: GET
URL: https://httpbin.org/basic-auth/simba/testpass123
Auth Type: Basic Auth
Username: simba
Password: testpass123
```

### Send Request

**Expected Response (200 OK):**
```json
{
  "authenticated": true,
  "user": "simba"
}
```

**Test Script:**
```javascript
pm.test('Authentication successful', function() {
  pm.response.to.have.status(200);
});

pm.test('User authenticated', function() {
  const response = pm.response.json();
  pm.expect(response.authenticated).to.be.true;
  pm.expect(response.user).to.equal('simba');
});
```

### Example 2: Wrong Credentials

**Change password to:** `wrongpassword`

**Expected Response (401 Unauthorized):**
```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Fake Realm"
```

**Test Script:**
```javascript
pm.test('Invalid credentials rejected', function() {
  pm.response.to.have.status(401);
});

pm.test('WWW-Authenticate header present', function() {
  pm.expect(pm.response.headers.get('WWW-Authenticate')).to.include('Basic');
});
```

---

## Real-World Example: GitHub API (Personal Access Token as Password)

GitHub API supports Basic Auth where:
- **Username**: Your GitHub username
- **Password**: Personal Access Token (not your actual password)

### Step 1: Generate Personal Access Token

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy token: `ghp_abcdefgh123456789`

### Step 2: Configure Request

**Environment:**
- `github_username` = `your-username`
- `github_pat` = `ghp_abcdefgh123456789`

**Request:**
```
Method: GET
URL: https://api.github.com/user
Auth Type: Basic Auth
Username: {{github_username}}
Password: {{github_pat}}
```

### Step 3: Send Request

**Expected Response (200 OK):**
```json
{
  "login": "your-username",
  "id": 123456,
  "avatar_url": "https://avatars.githubusercontent.com/u/123456",
  "name": "Your Name",
  "email": "you@example.com",
  "public_repos": 42,
  "followers": 100,
  "following": 50
}
```

**Test Script:**
```javascript
pm.test('GitHub user retrieved', function() {
  pm.response.to.have.status(200);
  const user = pm.response.json();
  pm.expect(user).to.have.property('login');
  pm.expect(user.login).to.equal(pm.environment.get('github_username'));
});
```

---

## Testing Different User Credentials

### Scenario: Admin vs Regular User

**Collection Variables:**
```json
{
  "admin_user": "admin",
  "admin_pass": "Admin@123",
  "regular_user": "user",
  "regular_pass": "User@123"
}
```

**Pre-request Script:**
```javascript
const testAsAdmin = pm.variables.get('test_as_admin') || false;

if (testAsAdmin) {
  pm.variables.set('current_user', pm.variables.get('admin_user'));
  pm.variables.set('current_pass', pm.variables.get('admin_pass'));
  console.log('🔐 Testing as: Admin');
} else {
  pm.variables.set('current_user', pm.variables.get('regular_user'));
  pm.variables.set('current_pass', pm.variables.get('regular_pass'));
  console.log('🔐 Testing as: Regular User');
}
```

**Auth Configuration:**
- Username: `{{current_user}}`
- Password: `{{current_pass}}`

**Collection Variable to Toggle:**
- `test_as_admin` = `true` (for admin) or `false` (for user)

---

## Base64 Encoding for Debugging

### Manual Encoding in Pre-request Script

```javascript
// Manually encode credentials (for debugging)
const username = pm.environment.get('api_username');
const password = pm.environment.get('api_password');

const credentials = `${username}:${password}`;
const base64Credentials = btoa(credentials);

console.log('Credentials (plain):', credentials);
console.log('Credentials (base64):', base64Credentials);
console.log('Authorization header:', `Basic ${base64Credentials}`);

// Verify Simba's encoding matches
const authHeader = pm.request.headers.get('Authorization');
console.log('Actual header:', authHeader);
```

### Decoding in Test Script

```javascript
// Decode auth header from request
const authHeader = pm.request.headers.get('Authorization');

if (authHeader && authHeader.startsWith('Basic ')) {
  const base64Credentials = authHeader.substring(6);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(':');
  
  console.log('Username:', username);
  console.log('Password:', password.replace(/./g, '*')); // Masked
  
  pm.test('Credentials match environment', function() {
    pm.expect(username).to.equal(pm.environment.get('api_username'));
  });
}
```

---

## Common Scenarios

### Scenario 1: Database REST APIs (e.g., CouchDB, Elasticsearch)

Many database REST APIs use Basic Auth for authentication:

**CouchDB Example:**
```
Method: GET
URL: http://localhost:5984/_all_dbs
Auth Type: Basic Auth
Username: admin
Password: adminpass
```

**Test Script:**
```javascript
pm.test('Database connection successful', function() {
  pm.response.to.have.status(200);
  const databases = pm.response.json();
  pm.expect(databases).to.be.an('array');
});
```

### Scenario 2: HTTP Basic Auth for Internal Tools

**Jenkins API Example:**
```
Method: GET
URL: http://jenkins.company.com/api/json
Auth Type: Basic Auth
Username: jenkins_user
Password: {{jenkins_api_token}}
```

### Scenario 3: Proxy Authentication

Some corporate proxies require Basic Auth:

**Pre-request Script:**
```javascript
// Proxy auth is handled by the HTTP client
// But you can test proxy-required endpoints
pm.request.addHeader({
  key: 'Proxy-Authorization',
  value: 'Basic ' + btoa('proxy_user:proxy_pass')
});
```

---

## Security Best Practices

### ✅ DO:
- **Always use HTTPS**: Basic Auth sends credentials in Base64 (not encrypted)
- **Use environment variables**: Never hardcode passwords
- **Rotate credentials regularly**: Change passwords periodically
- **Use strong passwords**: 12+ characters, mixed case, numbers, symbols
- **Limit credential scope**: Create API-specific users with minimal permissions
- **Log authentication failures**: Monitor for brute force attacks

### ❌ DON'T:
- **Don't use over HTTP**: Credentials can be intercepted (Base64 ≠ encryption)
- **Don't reuse passwords**: Each service should have unique credentials
- **Don't commit credentials**: Use `.gitignore` for environment files
- **Don't use for high-security apps**: Consider OAuth 2.0 or API keys instead
- **Don't store passwords in code**: Always use environment variables
- **Don't send credentials in URL**: Use headers, never `http://user:pass@domain.com`

---

## Troubleshooting

### 401 Unauthorized

**Symptom:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid username or password"
}
```

**Solutions:**
1. **Check credentials**: Verify username and password are correct
2. **Check encoding**: Ensure no extra spaces or newlines
3. **Check environment**: Verify variables are set and enabled
4. **Check case sensitivity**: Some systems are case-sensitive
5. **Check Auth tab**: Ensure "Basic Auth" is selected, not "No Auth"

### Missing Authorization Header

**Symptom:**
```json
{
  "error": "Authorization header missing"
}
```

**Solutions:**
1. Go to **Headers** tab, verify `Authorization` header exists
2. Check Auth tab is set to "Basic Auth"
3. Ensure username and password fields are not empty
4. If using variables, check they're defined in active environment

### Credentials Work in Browser, Not in Simba

**Possible Causes:**
1. **Cookie-based auth**: Browser uses cookies, Simba uses headers
2. **CORS issues**: Browser handles CORS differently than HTTP clients
3. **User-Agent**: Some servers check User-Agent header

**Solution:**
```javascript
// Pre-request Script: Set User-Agent
pm.request.headers.add({
  key: 'User-Agent',
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});
```

### Special Characters in Password

**Symptom:** Auth fails with special characters like `@, :, %`

**Solution:**
```javascript
// Pre-request Script: URL-encode password if needed
const password = pm.environment.get('api_password');
const encodedPassword = encodeURIComponent(password);
pm.environment.set('encoded_password', encodedPassword);
```

Then use `{{encoded_password}}` in Auth tab.

---

## Comparing with Other Auth Methods

| Feature | Basic Auth | Bearer Token | API Key | OAuth 2.0 |
|---------|-----------|--------------|---------|-----------|
| **Complexity** | Simple | Moderate | Simple | Complex |
| **Security** | Low (with HTTPS: Medium) | High | Medium | High |
| **Expiration** | No (credentials don't expire) | Yes (tokens expire) | Depends | Yes |
| **Performance** | Fast | Fast | Fast | Moderate |
| **Use Case** | Legacy APIs, Internal tools | Modern APIs, SPAs | Public APIs, Webhooks | Third-party access |
| **Credentials Sent** | Every request | Every request (token) | Every request | After initial flow |

**When to use Basic Auth:**
- ✅ Internal APIs with HTTPS
- ✅ Legacy systems without token support
- ✅ Simple authentication needs
- ✅ Development/testing environments
- ❌ Public-facing APIs (use OAuth 2.0)
- ❌ Mobile apps (use tokens)
- ❌ High-security requirements (use mutual TLS)

---

## Testing Checklist

- [ ] Credentials are stored in environment variables
- [ ] Request with valid credentials returns 200 OK
- [ ] Request with invalid credentials returns 401 Unauthorized
- [ ] Request without Auth returns 401 Unauthorized
- [ ] Authorization header is present in Headers tab
- [ ] Base64 encoding is correct (decode to verify)
- [ ] HTTPS is used (not HTTP)
- [ ] Different user roles have different access
- [ ] Special characters in password are handled correctly
- [ ] WWW-Authenticate header present in 401 responses

---

## Related Topics

- [Bearer Token Authentication](bearer-token.md) - Modern token-based auth
- [API Key Authentication](api-key.md) - Simple key-based auth
- [OAuth 2.0](oauth2.md) - Third-party authorization
- [Environment Variables](../core-concepts/environments.md) - Manage credentials
- [Pre-request Scripts](../advanced/pre-request-scripts.md) - Automate authentication
