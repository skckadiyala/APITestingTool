# OAuth 2.0 Authentication

OAuth 2.0 is an authorization framework that allows applications to access user data without exposing passwords. It's the industry standard for secure third-party access.

---

## Overview

OAuth 2.0:
- **Secure**: User credentials never shared with third-party apps
- **Scoped**: Fine-grained permissions (read-only, write access, etc.)
- **Token-based**: Uses short-lived access tokens + long-lived refresh tokens
- **Industry standard**: Used by Google, Facebook, GitHub, Microsoft, etc.

Common use cases:
- "Sign in with Google/GitHub/Microsoft"
- Third-party integrations (Zapier, IFTTT)
- Mobile apps accessing backend APIs
- Microservices authorization
- Partner API access

---

## How OAuth 2.0 Works

### The Authorization Flow

```
1. User clicks "Login with GitHub"
   ↓
2. App redirects to GitHub authorization page
   ↓
3. User approves permissions
   ↓
4. GitHub redirects back with authorization code
   ↓
5. App exchanges code for access token
   ↓
6. App uses access token to access user data
```

### Key Components

- **Resource Owner**: The user who owns the data
- **Client**: Your application requesting access
- **Authorization Server**: Issues tokens (e.g., GitHub OAuth)
- **Resource Server**: Hosts the protected data (e.g., GitHub API)
- **Access Token**: Short-lived (1 hour) token for API requests
- **Refresh Token**: Long-lived token to get new access tokens
- **Scopes**: Permissions requested (e.g., `read:user`, `repo`)

---

## OAuth 2.0 Grant Types

### 1. Authorization Code Flow (Most Common)

**Best for:** Web applications, mobile apps

**Flow:**
```
1. Redirect to authorization URL
2. User approves
3. Receive authorization code
4. Exchange code for tokens
5. Use access token
```

### 2. Client Credentials Flow

**Best for:** Server-to-server communication (no user involved)

**Flow:**
```
1. Send client ID + client secret
2. Receive access token
3. Use access token
```

### 3. Implicit Flow (Legacy)

**⚠️ Deprecated**: Use Authorization Code + PKCE instead

### 4. Resource Owner Password Flow (Legacy)

**⚠️ Not recommended**: Defeats purpose of OAuth (shares passwords)

---

## Setting Up OAuth 2.0 in Simba

### 1. Configure in Request

![OAuth 2.0 Configuration](../assets/screenshots/auth-oauth2-config.png)

1. Open your request in the Request Builder
2. Go to the **Auth** tab
3. Select **OAuth 2.0** from the dropdown
4. Enter:
   - **Access Token**: `{{access_token}}` (from environment)
   - **Token Type**: `Bearer` (most common)
   - **Refresh Token**: `{{refresh_token}}` (optional)

### 2. Environment Variables (Recommended)

```json
{
  "name": "Production",
  "variables": [
    {
      "key": "access_token",
      "value": "gho_1234567890abcdefghijklmnop",
      "enabled": true
    },
    {
      "key": "refresh_token",
      "value": "ghr_1234567890refresh",
      "enabled": true
    },
    {
      "key": "client_id",
      "value": "Iv1.abc123def456",
      "enabled": true
    },
    {
      "key": "client_secret",
      "value": "0123456789abcdef0123456789abcdef",
      "enabled": true
    }
  ]
}
```

---

## Real-World Example: GitHub OAuth

### Step 1: Register OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - Application name: `My Testing App`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/callback`
4. Get credentials:
   - **Client ID**: `Iv1.abc123def456`
   - **Client Secret**: `0123456789abcdef0123456789abcdef`

### Step 2: Authorization Flow

**Request 1: Get Authorization Code** (Open in browser)

```
https://github.com/login/oauth/authorize
  ?client_id=Iv1.abc123def456
  &redirect_uri=http://localhost:3000/callback
  &scope=repo,user
  &state=random_string_123
```

Parameters:
- `client_id`: Your OAuth app client ID
- `redirect_uri`: Where GitHub redirects after approval
- `scope`: Permissions requested (`repo` = full repo access, `user` = user profile)
- `state`: Random string for security (CSRF protection)

**User Action:**
1. User logs into GitHub (if not already)
2. Sees permission request: "My Testing App wants to access your repositories"
3. Clicks "Authorize"

**Result:**
GitHub redirects to:
```
http://localhost:3000/callback
  ?code=0123456789abcdef
  &state=random_string_123
```

Copy the `code` parameter: `0123456789abcdef`

### Step 3: Exchange Code for Token

**Create Request in Simba:**

```
Method: POST
URL: https://github.com/login/oauth/access_token
Headers:
  - Accept: application/json
Body (JSON):
{
  "client_id": "{{client_id}}",
  "client_secret": "{{client_secret}}",
  "code": "0123456789abcdef",
  "redirect_uri": "http://localhost:3000/callback"
}
```

**Expected Response (200 OK):**
```json
{
  "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "token_type": "bearer",
  "scope": "repo,user"
}
```

**Test Script (Save Token):**
```javascript
pm.test('OAuth token received', function() {
  pm.response.to.have.status(200);
  const response = pm.response.json();
  pm.expect(response).to.have.property('access_token');
  
  // Save token to environment
  pm.environment.set('access_token', response.access_token);
  console.log('✅ Access token saved to environment');
});
```

### Step 4: Use Access Token

**Create Request:**
```
Method: GET
URL: https://api.github.com/user
Auth Type: OAuth 2.0
  - Access Token: {{access_token}}
  - Token Type: Bearer
```

**Expected Response (200 OK):**
```json
{
  "login": "octocat",
  "id": 1,
  "avatar_url": "https://avatars.githubusercontent.com/u/1",
  "name": "The Octocat",
  "company": "GitHub",
  "email": "octocat@github.com",
  "public_repos": 8,
  "followers": 12345
}
```

**Test Script:**
```javascript
pm.test('User profile retrieved', function() {
  pm.response.to.have.status(200);
  const user = pm.response.json();
  pm.expect(user).to.have.property('login');
  pm.expect(user).to.have.property('email');
});
```

---

## Client Credentials Flow Example

**Best for:** Server-to-server, no user interaction

### Example: Spotify API

**Request:**
```
Method: POST
URL: https://accounts.spotify.com/api/token
Headers:
  - Content-Type: application/x-www-form-urlencoded
  - Authorization: Basic {{base64_client_credentials}}
Body (x-www-form-urlencoded):
  - grant_type: client_credentials
```

**Pre-request Script (Generate Authorization Header):**
```javascript
const clientId = pm.environment.get('spotify_client_id');
const clientSecret = pm.environment.get('spotify_client_secret');

const credentials = `${clientId}:${clientSecret}`;
const base64Credentials = btoa(credentials);

pm.environment.set('base64_client_credentials', base64Credentials);
```

**Expected Response:**
```json
{
  "access_token": "NgCXRK...MzYjw",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Test Script:**
```javascript
const response = pm.response.json();

pm.environment.set('spotify_access_token', response.access_token);

// Calculate expiration time
const expiresIn = response.expires_in; // seconds
const expiresAt = new Date(Date.now() + expiresIn * 1000);
pm.environment.set('token_expires_at', expiresAt.toISOString());

console.log(`Token expires at ${expiresAt.toLocaleString()}`);
```

---

## Token Refresh Flow

**When access token expires (401 response), use refresh token to get new access token:**

### Request: Refresh Token

```
Method: POST
URL: https://github.com/login/oauth/access_token
Headers:
  - Accept: application/json
Body (JSON):
{
  "client_id": "{{client_id}}",
  "client_secret": "{{client_secret}}",
  "grant_type": "refresh_token",
  "refresh_token": "{{refresh_token}}"
}
```

**Test Script:**
```javascript
const response = pm.response.json();

if (pm.response.code === 200) {
  // Update access token
  pm.environment.set('access_token', response.access_token);
  
  // Some services also rotate refresh tokens
  if (response.refresh_token) {
    pm.environment.set('refresh_token', response.refresh_token);
  }
  
  pm.test('Token refreshed', function() {
    pm.expect(response).to.have.property('access_token');
  });
  
  console.log('✅ Access token refreshed');
} else {
  console.log('❌ Token refresh failed. Please re-authenticate.');
}
```

---

## Automated Token Management

### Collection Pre-request Script (Token Auto-Refresh)

```javascript
// Check if token exists and is not expired
const accessToken = pm.environment.get('access_token');
const tokenExpiresAt = pm.environment.get('token_expires_at');

if (!accessToken || !tokenExpiresAt) {
  console.log('⚠️ No token found. Please authenticate first.');
  return;
}

// Check if token expires in next 5 minutes
const now = new Date();
const expiresAt = new Date(tokenExpiresAt);
const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);

console.log(`Token expires in ${minutesUntilExpiry} minutes`);

if (minutesUntilExpiry < 5) {
  console.log('⚠️ Token expiring soon. Consider refreshing.');
  pm.environment.set('should_refresh_token', 'true');
} else {
  console.log('✅ Token is valid');
}
```

### Test Script (Handle 401 and Trigger Refresh)

```javascript
if (pm.response.code === 401) {
  const error = pm.response.json();
  
  if (error.message && error.message.includes('token')) {
    console.log('❌ Token expired or invalid');
    pm.environment.set('should_refresh_token', 'true');
    
    pm.test('Token needs refresh', function() {
      pm.expect(pm.response.code).to.equal(401);
    });
  }
}
```

---

## Scopes and Permissions

### Understanding Scopes

Scopes define what actions your app can perform:

**GitHub Scopes:**
```
repo              - Full control of private repositories
repo:status       - Access commit status
public_repo       - Access public repositories
read:user         - Read user profile
user:email        - Access user email addresses
write:discussion  - Write team discussions
delete:packages   - Delete packages
```

**Request Different Scopes:**
```
https://github.com/login/oauth/authorize
  ?client_id={{client_id}}
  &scope=repo,user:email,read:org
```

### Testing Scope Restrictions

**Request 1: Read User (allowed with `user` scope)**
```
GET https://api.github.com/user
Expected: 200 OK
```

**Request 2: Delete Repo (requires `delete_repo` scope)**
```
DELETE https://api.github.com/repos/username/repo
Expected: 403 Forbidden (if scope not granted)
```

**Test Script:**
```javascript
if (pm.response.code === 403) {
  const error = pm.response.json();
  
  if (error.message && error.message.includes('scope')) {
    console.log('❌ Insufficient scope/permissions');
    pm.test('Scope verification', function() {
      pm.expect(pm.response.code).to.equal(403);
    });
  }
}
```

---

## Security Best Practices

### ✅ DO:
- **Use Authorization Code flow** for web/mobile apps
- **Always use HTTPS** for OAuth endpoints
- **Validate `state` parameter** (CSRF protection)
- **Store tokens securely**: Use environment variables, encrypted storage
- **Use short-lived access tokens** (1 hour typical)
- **Implement token refresh** for seamless UX
- **Request minimal scopes** needed
- **Rotate client secrets** periodically
- **Revoke unused tokens**

### ❌ DON'T:
- **Don't use Implicit flow** (deprecated, less secure)
- **Don't share client secrets** publicly or in frontend code
- **Don't store tokens in localStorage** (XSS risk)
- **Don't request excessive scopes** ("read,write,admin" when you only need "read")
- **Don't skip state parameter** validation
- **Don't reuse authorization codes** (one-time use only)
- **Don't hardcode redirect URIs** in production

---

## Common OAuth Providers

### GitHub

- **Authorization URL**: `https://github.com/login/oauth/authorize`
- **Token URL**: `https://github.com/login/oauth/access_token`
- **API Base**: `https://api.github.com`
- **Scopes**: `repo`, `user`, `admin:org`, `workflow`

### Google

- **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **API Base**: `https://www.googleapis.com/`
- **Scopes**: `https://www.googleapis.com/auth/userinfo.profile`, `gmail.readonly`

### Microsoft

- **Authorization URL**: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- **API Base**: `https://graph.microsoft.com/v1.0`
- **Scopes**: `User.Read`, `Mail.Read`, `Files.ReadWrite`

---

## Troubleshooting

### Authorization Code Invalid (400)

**Symptom:**
```json
{
  "error": "bad_verification_code",
  "error_description": "The code passed is incorrect or expired."
}
```

**Solutions:**
1. Authorization codes are **one-time use** - don't reuse
2. Codes expire quickly (usually 10 minutes) - use immediately
3. Verify `redirect_uri` matches exactly (including trailing slash)
4. Check `client_id` and `client_secret` are correct

### Invalid Client (401)

**Symptom:**
```json
{
  "error": "unauthorized_client",
  "error_description": "Client authentication failed"
}
```

**Solutions:**
1. Verify `client_id` and `client_secret` are correct
2. Check OAuth app is active (not revoked)
3. Ensure using correct token endpoint URL
4. Verify Basic Auth encoding for client credentials

### Insufficient Scope (403)

**Symptom:**
```json
{
  "message": "Resource not accessible by integration",
  "documentation_url": "https://docs.github.com/rest/reference/repos"
}
```

**Solutions:**
1. Re-authorize with additional scopes
2. Check required scopes in API documentation
3. User may have denied some scopes - check approval screen
4. Organization may restrict certain scopes

### Redirect URI Mismatch (400)

**Symptom:**
```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "The redirect_uri MUST match the registered callback URL"
}
```

**Solutions:**
1. Verify `redirect_uri` in request matches registered URL exactly
2. Check for trailing slashes (`/callback` vs `/callback/`)
3. Ensure protocol matches (`http://` vs `https://`)
4. Update registered callback URL in OAuth app settings

---

## Testing Checklist

- [ ] OAuth app registered with provider
- [ ] Client ID and secret stored in environment
- [ ] Authorization URL generates correct parameters
- [ ] User can approve permissions
- [ ] Authorization code received in callback
- [ ] Code successfully exchanged for access token
- [ ] Access token stored in environment variable
- [ ] Protected API requests work with token
- [ ] Token expiration is handled (401 → refresh)
- [ ] Refresh token successfully generates new access token
- [ ] Different scopes grant different permissions
- [ ] Insufficient scope returns 403
- [ ] Invalid token returns 401
- [ ] State parameter validated (CSRF protection)

---

## Related Topics

- [Bearer Token Authentication](bearer-token.md) - Using OAuth-issued tokens
- [API Key Authentication](api-key.md) - Simpler alternative for server-to-server
- [Pre-request Scripts](../advanced/pre-request-scripts.md) - Automate token refresh
- [Environment Variables](../core-concepts/environments.md) - Manage tokens securely
- [OAuth Flow Tutorial](../tutorials/oauth-flow.md) - Complete step-by-step guide
