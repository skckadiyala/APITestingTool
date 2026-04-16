# OAuth 2.0 Flow Testing Tutorial

Master OAuth 2.0 authentication testing with real-world examples using GitHub OAuth. Learn authorization code flow, token management, and automated refresh.

---

## Overview

**What you'll learn:**
- Implement OAuth 2.0 authorization code flow
- Exchange authorization code for access token
- Refresh expired tokens automatically
- Test with real OAuth provider (GitHub)
- Store tokens securely in environment
- Handle OAuth errors and edge cases

**Prerequisites:**
- Simba installed and running
- GitHub account
- Basic understanding of OAuth 2.0
- Ability to register OAuth apps

**Time required:** 50 minutes

**OAuth Provider:** [GitHub OAuth Apps](https://github.com/settings/developers)

---

## Part 1: Understanding OAuth 2.0 Flow

### The Four-Step Process

```
1. Authorization Request
   User → OAuth Provider
   "I want to authorize this app"

2. Authorization Grant
   OAuth Provider → User
   Redirects with authorization code

3. Token Exchange
   App → OAuth Provider
   Exchange code for access token

4. Authenticated Requests
   App → API
   Use access token for API calls
```

**Visual flow:**
```
┌──────┐                                  ┌─────────────────┐
│ User │                                  │ GitHub (OAuth)  │
└──┬───┘                                  └────────┬────────┘
   │                                               │
   │ 1. Click "Login with GitHub"                 │
   ├──────────────────────────────────────────────>│
   │                                               │
   │ 2. Redirect to authorization URL             │
   │    with client_id, scope, redirect_uri       │
   │<──────────────────────────────────────────────┤
   │                                               │
   │ 3. User authorizes app                        │
   ├──────────────────────────────────────────────>│
   │                                               │
   │ 4. Redirect back with code                    │
   │    https://app.com/callback?code=abc123       │
   │<──────────────────────────────────────────────┤
   │                                               │
┌──┴───┐                                  ┌────────┴────────┐
│ App  │                                  │ GitHub API      │
└──┬───┘                                  └────────┬────────┘
   │                                               │
   │ 5. Exchange code for token                    │
   │    POST /login/oauth/access_token             │
   ├──────────────────────────────────────────────>│
   │                                               │
   │ 6. Returns access_token                       │
   │<──────────────────────────────────────────────┤
   │                                               │
   │ 7. Use access_token in API calls              │
   │    GET /user                                  │
   │    Authorization: Bearer {access_token}       │
   ├──────────────────────────────────────────────>│
   │                                               │
   │ 8. Returns user data                          │
   │<──────────────────────────────────────────────┤
```

---

## Part 2: Register OAuth App

### Create GitHub OAuth App

1. **Go to GitHub Developer Settings:**
   ```
   GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   ```

2. **Register application:**
   ```
   Application name: Simba OAuth Testing
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:5173/oauth/callback
   
   [Register application]
   ```

3. **Get credentials:**
   ```
   Client ID: Iv1.a1b2c3d4e5f6g7h8
   
   [Generate a new client secret]
   
   Client Secret: 1234567890abcdefghijklmnopqrstuvwxyz (copy and save securely!)
   ```

4. **Save credentials securely** (DO NOT commit to git)

---

## Part 3: Setup in Simba

### Create Workspace and Collection

1. **Create workspace:**
   ```
   Workspaces → + New Workspace
   Name: OAuth 2.0 Tutorial
   Description: Learning OAuth 2.0 flows
   ```

2. **Create collection:**
   ```
   Collections → + New Collection
   Name: GitHub OAuth Flow
   Description: Complete OAuth 2.0 authorization code flow
   ```

3. **Create environment:**
   ```
   Environments → + New Environment
   Name: GitHub OAuth
   
   Variables:
     # OAuth App Credentials (from GitHub)
     clientId:           Iv1.a1b2c3d4e5f6g7h8
     clientSecret:       1234567890abcdef... (secret)
     redirectUri:        http://localhost:5173/oauth/callback
     
     # OAuth Endpoints
     authorizationUrl:   https://github.com/login/oauth/authorize
     tokenUrl:           https://github.com/login/oauth/access_token
     apiBaseUrl:         https://api.github.com
     
     # OAuth Flow Variables (will be set dynamically)
     authorizationCode:  (empty - will be set from redirect)
     accessToken:        (empty - will be set from token exchange)
     refreshToken:       (empty - if provider supports it)
     tokenExpiresIn:     (empty)
     
     # Request State
     state:              (empty - CSRF protection)
     scope:              user,repo
   ```

4. **Activate environment:**
   ```
   Environment dropdown → Select "GitHub OAuth"
   ```

---

## Part 4: Step 1 - Authorization Request

### Manual Authorization (Understanding the Flow)

**Authorization URL format:**
```
https://github.com/login/oauth/authorize
  ?client_id=Iv1.a1b2c3d4e5f6g7h8
  &redirect_uri=http://localhost:5173/oauth/callback
  &scope=user,repo
  &state=random_string_for_csrf
```

**Create request helper:**
```
Request name: 1. Generate Authorization URL
Method: GET (informational only)
```

**Pre-request script:**
```javascript
// Generate random state for CSRF protection
const state = Math.random().toString(36).substring(7);
pm.environment.set('state', state);

// Build authorization URL
const clientId = pm.environment.get('clientId');
const redirectUri = encodeURIComponent(pm.environment.get('redirectUri'));
const scope = pm.environment.get('scope');
const authUrl = pm.environment.get('authorizationUrl');

const fullAuthUrl = `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

console.log('Authorization URL:');
console.log(fullAuthUrl);
console.log('');
console.log('Open this URL in your browser to authorize the app');
console.log('After authorization, you will be redirected with a code parameter');
pm.environment.set('fullAuthorizationUrl', fullAuthUrl);
```

**Expected output:**
```
Authorization URL:
https://github.com/login/oauth/authorize?client_id=Iv1.a1b2c3d4e5f6g7h8&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Foauth%2Fcallback&scope=user%2Crepo&state=x7k2p5m

Open this URL in your browser to authorize the app
After authorization, you will be redirected with a code parameter
```

**Manual step:**
1. Copy authorization URL from console
2. Open in browser
3. Click "Authorize [App Name]"
4. You'll be redirected to: `http://localhost:5173/oauth/callback?code=abc123xyz789&state=x7k2p5m`
5. **Copy the `code` parameter value**: `abc123xyz789`
6. **Paste into environment variable**: `authorizationCode = abc123xyz789`

---

## Part 5: Step 2 - Exchange Code for Token

### Request: Exchange Authorization Code

**Create request:**
```
Request name: 2. Exchange Code for Access Token
Method: POST
URL: {{tokenUrl}}
```

**Headers:**
```
Accept: application/json
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "client_id": "{{clientId}}",
  "client_secret": "{{clientSecret}}",
  "code": "{{authorizationCode}}",
  "redirect_uri": "{{redirectUri}}"
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Access token received", () => {
    const response = pm.response.json();
    pm.expect(response).to.have.property('access_token');
    pm.expect(response.access_token).to.be.a('string').and.not.empty;
    
    // Save access token to environment
    pm.environment.set('accessToken', response.access_token);
    console.log('Access token received and saved');
});

pm.test("Token type is bearer", () => {
    const response = pm.response.json();
    pm.expect(response.token_type).to.equal('bearer');
});

pm.test("Scope matches requested", () => {
    const response = pm.response.json();
    const requestedScope = pm.environment.get('scope');
    pm.expect(response.scope).to.include('user');
});

// Log token info (DO NOT log full token in production!)
const response = pm.response.json();
console.log('Token type:', response.token_type);
console.log('Scope:', response.scope);

// GitHub doesn't provide refresh tokens, but other providers do
if (response.refresh_token) {
    pm.environment.set('refreshToken', response.refresh_token);
    console.log('Refresh token saved');
}

if (response.expires_in) {
    pm.environment.set('tokenExpiresIn', response.expires_in);
    const expiresAt = Date.now() + (response.expires_in * 1000);
    pm.environment.set('tokenExpiresAt', expiresAt);
    console.log('Token expires in:', response.expires_in, 'seconds');
}
```

**Send request:**
```
Response:
  Status: 200 OK
  
Body:
  {
    "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
    "token_type": "bearer",
    "scope": "user,repo"
  }

Tests: ✅ 4/4 passed
Environment: accessToken saved
```

---

## Part 6: Step 3 - Use Access Token

### Request: Get Authenticated User

**Create request:**
```
Request name: 3. Get Authenticated User
Method: GET
URL: {{apiBaseUrl}}/user
```

**Authentication:**
```
Auth Type: Bearer Token
Token: {{accessToken}}
```

**Alternative (manual headers):**
```
Authorization: Bearer {{accessToken}}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("User data received", () => {
    const user = pm.response.json();
    pm.expect(user).to.have.property('login');
    pm.expect(user).to.have.property('id');
    pm.expect(user).to.have.property('email');
});

pm.test("Token is valid", () => {
    // If we got user data, token is valid
    const user = pm.response.json();
    pm.expect(user.login).to.be.a('string');
    
    // Save user info for later use
    pm.environment.set('authenticatedUser', user.login);
    console.log('Authenticated as:', user.login);
});
```

**Response:**
```json
{
  "login": "octocat",
  "id": 1,
  "avatar_url": "https://github.com/images/error/octocat_happy.gif",
  "name": "The Octocat",
  "email": "octocat@github.com",
  "public_repos": 8,
  "public_gists": 8,
  "followers": 3500,
  "following": 9,
  "created_at": "2008-01-14T04:33:35Z"
}

Tests: ✅ 3/3 passed
```

### Request: Access Protected Resource

**Create request:**
```
Request name: 4. List User Repositories
Method: GET
URL: {{apiBaseUrl}}/user/repos?per_page=10
```

**Authentication:**
```
Auth Type: Bearer Token
Token: {{accessToken}}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Repositories list retrieved", () => {
    const repos = pm.response.json();
    pm.expect(repos).to.be.an('array');
    
    if (repos.length > 0) {
        pm.expect(repos[0]).to.have.property('name');
        pm.expect(repos[0]).to.have.property('private');
    }
});

pm.test("Private repos visible (scope: repo)", () => {
    const repos = pm.response.json();
    // If scope includes 'repo', we should see private repos
    const hasPrivateRepos = repos.some(r => r.private === true);
    
    if (hasPrivateRepos) {
        console.log('✅ Can access private repositories');
    } else {
        console.log('ℹ️  No private repositories or scope limited');
    }
});
```

---

## Part 7: Token Refresh (Advanced)

### Automatic Token Refresh

**Note:** GitHub OAuth Apps don't provide refresh tokens. This example shows the pattern for providers that do (like Google, Microsoft, etc.)

**Collection pre-request script:**
```javascript
// Check if token is expired
const tokenExpiresAt = pm.environment.get('tokenExpiresAt');

if (tokenExpiresAt) {
    const now = Date.now();
    const expiresIn = tokenExpiresAt - now;
    
    // If token expires in less than 5 minutes, refresh it
    if (expiresIn < 5 * 60 * 1000) {
        console.log('Token expiring soon, refreshing...');
        
        const refreshToken = pm.environment.get('refreshToken');
        const tokenUrl = pm.environment.get('tokenUrl');
        const clientId = pm.environment.get('clientId');
        const clientSecret = pm.environment.get('clientSecret');
        
        // Make refresh request (synchronous in pre-request script)
        pm.sendRequest({
            url: tokenUrl,
            method: 'POST',
            header: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: {
                mode: 'raw',
                raw: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret
                })
            }
        }, (err, response) => {
            if (err) {
                console.error('Token refresh failed:', err);
            } else {
                const data = response.json();
                pm.environment.set('accessToken', data.access_token);
                
                if (data.refresh_token) {
                    pm.environment.set('refreshToken', data.refresh_token);
                }
                
                if (data.expires_in) {
                    const newExpiresAt = Date.now() + (data.expires_in * 1000);
                    pm.environment.set('tokenExpiresAt', newExpiresAt);
                }
                
                console.log('✅ Token refreshed successfully');
            }
        });
    }
}
```

---

## Part 8: Error Handling

### Test: Invalid Authorization Code

**Create request:**
```
Request name: Test Invalid Code
Method: POST
URL: {{tokenUrl}}
```

**Body:**
```json
{
  "client_id": "{{clientId}}",
  "client_secret": "{{clientSecret}}",
  "code": "invalid_code_12345",
  "redirect_uri": "{{redirectUri}}"
}
```

**Test script:**
```javascript
pm.test("Status code indicates error", () => {
    // Different providers handle this differently
    // GitHub returns 200 but with error in body
    pm.expect(pm.response.code).to.be.oneOf([400, 401, 200]);
});

pm.test("Error message present", () => {
    const response = pm.response.json();
    // GitHub returns error and error_description
    pm.expect(response).to.have.property('error');
});

pm.test("Error is descriptive", () => {
    const response = pm.response.json();
    console.log('Error:', response.error);
    console.log('Description:', response.error_description);
    pm.expect(response.error_description).to.be.a('string');
});
```

**Expected response:**
```json
{
  "error": "bad_verification_code",
  "error_description": "The code passed is incorrect or expired.",
  "error_uri": "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code"
}
```

### Test: Expired Token

**Create request:**
```
Request name: Test Expired Token
Method: GET
URL: {{apiBaseUrl}}/user
```

**Pre-request script:**
```javascript
// Temporarily use an invalid token
pm.environment.set('accessToken', 'gho_invalid_token_12345');
```

**Test script:**
```javascript
pm.test("Status code is 401 Unauthorized", () => {
    pm.response.to.have.status(401);
});

pm.test("Error message indicates bad credentials", () => {
    const response = pm.response.json();
    pm.expect(response.message).to.include('Bad credentials');
});
```

### Test: Insufficient Scope

**Scenario:** Try to access resource that requires scope not granted

**Create request:**
```
Request name: Test Insufficient Scope
Method: POST
URL: {{apiBaseUrl}}/user/repos
```

**Body (try to create repo without 'public_repo' scope):**
```json
{
  "name": "test-repo",
  "description": "Test repository"
}
```

**Test script:**
```javascript
pm.test("Status code indicates forbidden or unauthorized", () => {
    pm.expect(pm.response.code).to.be.oneOf([401, 403, 404]);
});

pm.test("Error indicates scope issue", () => {
    const response = pm.response.json();
    // GitHub might return "Not Found" to avoid leaking info
    pm.expect(response.message).to.exist;
    console.log('Error:', response.message);
});
```

---

## Part 9: Complete OAuth Workflow

### Automated End-to-End Flow

**Folder: Complete OAuth Flow**

**Request 1: Generate Auth URL**
```javascript
// Pre-request script (already covered in Part 4)
const state = Math.random().toString(36).substring(7);
pm.environment.set('state', state);
// ... generate URL
```

**Manual step:** Authorize in browser, copy code

**Request 2: Exchange Code for Token**
```
(Already covered in Part 5)
```

**Request 3: Get User Profile**
```
(Already covered in Part 6)
```

**Request 4: List Repositories**
```
(Already covered in Part 6)
```

**Request 5: Create Repository**
```
Method: POST
URL: {{apiBaseUrl}}/user/repos
Auth: Bearer {{accessToken}}

Body:
{
  "name": "oauth-test-repo",
  "description": "Created via OAuth",
  "private": false
}
```

**Request 6: Delete Repository (cleanup)**
```
Method: DELETE
URL: {{apiBaseUrl}}/repos/{{authenticatedUser}}/oauth-test-repo
Auth: Bearer {{accessToken}}
```

---

## Part 10: Security Best Practices

### Collection Test Script (Runs After Every Request)

**Add to collection:**
```javascript
// Verify secure connection
pm.test("Request uses HTTPS", () => {
    const url = pm.request.url.toString();
    pm.expect(url).to.match(/^https:\/\//);
});

// Check for token leaks in URL
pm.test("Access token not in URL", () => {
    const url = pm.request.url.toString();
    const token = pm.environment.get('accessToken');
    if (token) {
        pm.expect(url).to.not.include(token);
    }
});

// Verify Authorization header is used (not query param)
pm.test("Authorization via header (not query)", () => {
    const headers = pm.request.headers.all();
    const authHeader = headers.find(h => h.key === 'Authorization');
    
    if (pm.environment.get('accessToken')) {
        pm.expect(authHeader).to.exist;
    }
});
```

### ✅ Best Practices

**Secure credential storage:**
```
✅ Store clientSecret as "secret" type in environment
✅ Never log full access tokens to console
✅ Use environment variables, not hard-coded values
✅ Delete test tokens after tutorial
```

**CSRF protection:**
```javascript
// Always use state parameter
const state = crypto.randomBytes(16).toString('hex');
pm.environment.set('state', state);

// Verify state on callback
const receivedState = /* extract from redirect */;
if (receivedState !== pm.environment.get('state')) {
    throw new Error('CSRF attack detected!');
}
```

**Scope principle of least privilege:**
```
✅ Request only scopes you actually need
❌ Don't request 'admin' scope if you only need 'read'

Example:
  Need read-only access to repos: scope=repo:status
  Need to create repos: scope=public_repo
  Need full control: scope=repo (only if necessary)
```

### ❌ Don't Do This

**Never store tokens in code:**
```javascript
// ❌ BAD
const accessToken = 'gho_16C7e42F292c6912E7710c838347Ae178B4a';

// ✅ GOOD
const accessToken = pm.environment.get('accessToken');
```

**Never log sensitive data:**
```javascript
// ❌ BAD
console.log('Access token:', pm.environment.get('accessToken'));

// ✅ GOOD
console.log('Access token received:', pm.environment.get('accessToken') ? 'Yes' : 'No');
```

**Never commit credentials to git:**
```bash
# ❌ BAD
git add environments/github-oauth.json

# ✅ GOOD
# Add to .gitignore
echo "environments/*.json" >> .gitignore
```

---

## Part 11: Testing Multiple Providers

### Google OAuth 2.0

**Differences from GitHub:**
- Provides refresh tokens (offline access)
- Uses different scopes (e.g., `https://www.googleapis.com/auth/userinfo.profile`)
- Token endpoint: `https://oauth2.googleapis.com/token`
- Requires `grant_type` parameter

**Example token exchange:**
```json
{
  "code": "{{authorizationCode}}",
  "client_id": "{{clientId}}",
  "client_secret": "{{clientSecret}}",
  "redirect_uri": "{{redirectUri}}",
  "grant_type": "authorization_code"
}
```

### Microsoft OAuth 2.0

**Differences:**
- Uses Azure AD endpoints
- Supports multiple token versions (v1.0, v2.0)
- Scopes are app-specific (e.g., `https://graph.microsoft.com/User.Read`)

---

## Collection Structure

```
📁 GitHub OAuth Flow
  📂 1. Authorization
    └── Generate Authorization URL
  
  📂 2. Token Exchange
    ├── Exchange Code for Access Token
    └── Test Invalid Code
  
  📂 3. Authenticated Requests
    ├── Get Authenticated User
    ├── List User Repositories
    └── Create Repository
  
  📂 4. Error Handling
    ├── Test Expired Token
    ├── Test Insufficient Scope
    └── Test Invalid Code
  
  📂 5. Complete Workflow
    ├── 1. Generate Auth URL
    ├── 2. Exchange Code
    ├── 3. Get User Profile
    ├── 4. List Repos
    ├── 5. Create Repo
    └── 6. Delete Repo (Cleanup)
```

---

## Next Steps

**Expand OAuth testing:**
1. Test other OAuth providers (Google, Microsoft, Auth0)
2. Implement PKCE (Proof Key for Code Exchange) for mobile apps
3. Test token refresh flows
4. Test revocation endpoints

**Production integration:**
1. Integrate OAuth into your application
2. Store tokens securely (database, not environment)
3. Implement automatic token refresh
4. Add token revocation on logout

---

## Related Topics

- [Bearer Token Authentication](../authentication/bearer-token.md) - Using OAuth tokens
- [OAuth 2.0 Auth Type](../authentication/oauth2.md) - OAuth configuration guide
- [Test Scripts](../advanced/test-scripts.md) - Advanced test techniques
- [Environments](../core-concepts/environments.md) - Secure credential management
- [CI/CD Integration](cicd-integration.md) - Automate OAuth tests
