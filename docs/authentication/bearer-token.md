# Bearer Token Authentication

Bearer token authentication is the most common authentication method for modern APIs. It uses a token (typically a JWT) sent in the `Authorization` header.

---

## Overview

Bearer tokens are:
- **Stateless**: Server doesn't need to store session data
- **Self-contained**: Token contains user information and claims
- **Secure**: Cryptographically signed to prevent tampering
- **Time-limited**: Tokens expire after a set period (e.g., 1 hour, 1 day)

Common use cases:
- REST APIs with JWT authentication
- OAuth 2.0 token-based access
- Microservices authentication
- Mobile app backends

---

## How It Works

1. User logs in with credentials → Server returns access token
2. Client stores token (memory, localStorage, secure cookie)
3. Client includes token in subsequent requests
4. Server validates token and processes request

Token format in header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Setting Up Bearer Token Auth in Simba

### 1. Configure in Request

![Bearer Token Configuration](../assets/screenshots/auth-bearer-config.png)

1. Open your request in the Request Builder
2. Go to the **Auth** tab
3. Select **Bearer Token** from the dropdown
4. Enter your token in the **Token** field

### 2. Using Environment Variables (Recommended)

Instead of hardcoding tokens, use environment variables:

**Environment Setup:**
```json
{
  "name": "Production",
  "variables": [
    {
      "key": "access_token",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "enabled": true
    }
  ]
}
```

**Request Configuration:**
- Token field: `{{access_token}}`

This allows you to:
- ✅ Switch between environments (Dev, Staging, Prod)
- ✅ Keep tokens out of version control
- ✅ Update tokens in one place
- ✅ Share collections without exposing secrets

---

## Real-World Example: GitHub API

### Step 1: Generate GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Select scopes: `repo`, `user`, `notifications`
4. Copy the generated token: `ghp_1234567890abcdefghijklmnopqrstuv`

### Step 2: Configure in Simba

**Create Environment:**
- Name: `GitHub API`
- Variable: `github_token` = `ghp_1234567890abcdefghijklmnopqrstuv`

**Create Request:**
```
Method: GET
URL: https://api.github.com/user/repos
Auth Type: Bearer Token
Token: {{github_token}}
```

### Step 3: Send Request

**Expected Response (200 OK):**
```json
[
  {
    "id": 123456,
    "name": "my-awesome-repo",
    "full_name": "username/my-awesome-repo",
    "private": false,
    "owner": {
      "login": "username",
      "id": 789012,
      "avatar_url": "https://avatars.githubusercontent.com/u/789012"
    },
    "html_url": "https://github.com/username/my-awesome-repo",
    "description": "A cool project",
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2024-02-20T14:45:00Z"
  }
]
```

### Step 4: Test Token Validation

**Add Test Script:**
```javascript
pm.test('Authentication successful', function() {
  pm.response.to.have.status(200);
  pm.expect(pm.response.json()).to.be.an('array');
});

pm.test('User has repositories', function() {
  const repos = pm.response.json();
  pm.expect(repos.length).to.be.above(0);
});

pm.test('Response contains owner info', function() {
  const repos = pm.response.json();
  pm.expect(repos[0]).to.have.property('owner');
  pm.expect(repos[0].owner).to.have.property('login');
});
```

---

## Dynamic Token Refresh Flow

Many APIs use short-lived access tokens with refresh tokens. Here's how to automate token refresh:

### Scenario: Login and Auto-Refresh

**Request 1: Login** (POST to `/auth/login`)

**Pre-request Script:**
```javascript
// Clear old tokens before login
pm.environment.unset('access_token');
pm.environment.unset('refresh_token');
```

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Test Script:**
```javascript
const response = pm.response.json();

// Store tokens in environment
pm.environment.set('access_token', response.accessToken);
pm.environment.set('refresh_token', response.refreshToken);

// Validation
pm.test('Login successful', function() {
  pm.response.to.have.status(200);
  pm.expect(response).to.have.property('accessToken');
  pm.expect(response).to.have.property('refreshToken');
});
```

**Request 2: Protected Endpoint** (GET to `/api/user/profile`)

**Auth Configuration:**
- Type: Bearer Token
- Token: `{{access_token}}`

**Test Script:**
```javascript
pm.test('Profile retrieved', function() {
  pm.response.to.have.status(200);
  const profile = pm.response.json();
  pm.expect(profile).to.have.property('email');
});
```

**Request 3: Refresh Token** (POST to `/auth/refresh`)

**Pre-request Script:**
```javascript
// This request should run when access token expires (401 response)
const refreshToken = pm.environment.get('refresh_token');
if (!refreshToken) {
  throw new Error('No refresh token available. Please login first.');
}
```

**Request Body (JSON):**
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**Test Script:**
```javascript
const response = pm.response.json();

if (pm.response.code === 200) {
  // Update access token
  pm.environment.set('access_token', response.accessToken);
  
  // Some APIs also rotate refresh tokens
  if (response.refreshToken) {
    pm.environment.set('refresh_token', response.refreshToken);
  }
  
  console.log('✅ Token refreshed successfully');
} else {
  console.log('❌ Token refresh failed. Please login again.');
}
```

---

## JWT Token Inspection

### Decoding JWT in Pre-request Script

```javascript
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const token = pm.environment.get('access_token');
if (token) {
  const decoded = parseJwt(token);
  console.log('Token payload:', decoded);
  
  // Check expiration
  if (decoded && decoded.exp) {
    const expiresAt = new Date(decoded.exp * 1000);
    const now = new Date();
    const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);
    
    console.log(`Token expires in ${minutesUntilExpiry} minutes`);
    
    if (minutesUntilExpiry < 5) {
      console.log('⚠️ Token expiring soon! Consider refreshing.');
    }
  }
}
```

---

## Common Scenarios

### Scenario 1: Multi-Tenant APIs

Some APIs require tenant ID in the token or header:

```javascript
// Pre-request Script
const tenantId = pm.environment.get('tenant_id');
pm.request.headers.add({
  key: 'X-Tenant-ID',
  value: tenantId
});
```

### Scenario 2: Token Expiration Handling

```javascript
// Test Script
if (pm.response.code === 401) {
  const error = pm.response.json();
  
  if (error.message && error.message.includes('expired')) {
    console.log('❌ Token expired. Run refresh token request.');
    pm.environment.set('token_expired', 'true');
  }
}
```

### Scenario 3: Role-Based Testing

```javascript
// Pre-request Script: Use different tokens for different roles
const testRole = pm.variables.get('test_role'); // 'admin', 'user', 'guest'

const tokens = {
  admin: pm.environment.get('admin_token'),
  user: pm.environment.get('user_token'),
  guest: pm.environment.get('guest_token')
};

const token = tokens[testRole] || tokens.user;
pm.environment.set('current_token', token);
```

**Auth Configuration:**
- Token: `{{current_token}}`

**Collection Variable:**
- `test_role` = `admin` (change to test different roles)

---

## Security Best Practices

### ✅ DO:
- **Use HTTPS**: Bearer tokens are sent in plaintext (Base64 is not encryption)
- **Store tokens securely**: Use environment variables, never commit to Git
- **Implement token expiration**: Short-lived tokens (15-60 minutes) are safer
- **Use refresh tokens**: For seamless user experience with short access tokens
- **Validate tokens server-side**: Always verify signature and expiration
- **Rotate tokens**: Implement token rotation on refresh

### ❌ DON'T:
- **Don't hardcode tokens**: Use environment variables instead
- **Don't share tokens**: Each user/system should have their own token
- **Don't store tokens in localStorage** (XSS risk): Use httpOnly cookies when possible
- **Don't send tokens over HTTP**: Always use HTTPS
- **Don't use tokens without expiration**: Always set an expiry time
- **Don't log tokens**: Avoid console.log() with full token values in production

---

## Troubleshooting

### Invalid Token Error (401)

**Symptom:**
```json
{
  "error": "Invalid token",
  "message": "Token verification failed"
}
```

**Solutions:**
1. Check token format: Must start with `Bearer ` (note the space)
2. Verify token hasn't expired: Decode JWT and check `exp` claim
3. Ensure token is for the correct environment (Dev token won't work in Prod)
4. Check for extra spaces or newlines in token value

### Token Missing Error (401)

**Symptom:**
```json
{
  "error": "Unauthorized",
  "message": "No authorization header"
}
```

**Solutions:**
1. Verify Auth tab is set to "Bearer Token"
2. Check token field is not empty
3. If using variable (`{{token}}`), verify environment has the variable set
4. Use **Request Builder → Headers tab** to see actual headers being sent

### Token Expired (401/403)

**Symptom:**
```json
{
  "error": "Token expired",
  "message": "Please obtain a new token"
}
```

**Solutions:**
1. Run the refresh token request
2. If no refresh token, login again to get new tokens
3. Check token expiration time (decode JWT `exp` claim)
4. Automate token refresh in collection pre-request script

---

## Testing Checklist

Use this checklist when testing Bearer token authentication:

- [ ] Login request successfully returns access token
- [ ] Token is stored in environment variable
- [ ] Protected endpoints accept the token (200 OK)
- [ ] Invalid token returns 401 Unauthorized
- [ ] Expired token returns 401 with appropriate error message
- [ ] Refresh token successfully generates new access token
- [ ] Token includes expected claims (userId, roles, permissions)
- [ ] Token expiration time is appropriate (check `exp` claim)
- [ ] Different user roles have different access levels
- [ ] Logout/revoke invalidates the token

---

## Related Topics

- [Basic Authentication](basic-auth.md) - Username/password authentication
- [API Key Authentication](api-key.md) - Simple key-based auth
- [OAuth 2.0](oauth2.md) - Third-party authorization
- [Pre-request Scripts](../advanced/pre-request-scripts.md) - Automate token handling
- [Environment Variables](../core-concepts/environments.md) - Manage tokens per environment
