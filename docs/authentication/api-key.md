# API Key Authentication

API Key authentication is a simple method where each client gets a unique key to identify and authenticate requests. The key can be sent in headers, query parameters, or request body.

---

## Overview

API Keys are:
- **Simple**: Just a string value, easy to implement
- **Unique per client**: Each user/app gets their own key
- **Revocable**: Keys can be invalidated without changing passwords
- **Trackable**: Server can track usage per API key
- **Long-lived**: Typically don't expire (unlike tokens)

Common use cases:
- Public APIs with rate limiting (Google Maps, OpenWeatherMap)
- Webhook integrations
- Third-party service integrations
- Server-to-server communication
- Analytics and tracking services

---

## How It Works

1. Developer registers and receives an API key
2. Client includes key in every request (header, query param, or body)
3. Server validates the key and tracks usage
4. If valid, processes request; if invalid, returns 401/403

Common formats:
- **Header**: `X-API-Key: abc123...` or `Authorization: ApiKey abc123...`
- **Query Parameter**: `?api_key=abc123...` or `?key=abc123...`
- **Request Body**: `{ "apiKey": "abc123..." }`

---

## Setting Up API Key Auth in Simba

### 1. Configure in Request

![API Key Configuration](../assets/screenshots/auth-apikey-config.png)

1. Open your request in the Request Builder
2. Go to the **Auth** tab
3. Select **API Key** from the dropdown
4. Configure:
   - **Key**: The parameter name (e.g., `X-API-Key`, `api_key`)
   - **Value**: Your API key
   - **Add To**: Choose **Header** or **Query Params**

### 2. Using Environment Variables (Recommended)

**Environment Setup:**
```json
{
  "name": "Production",
  "variables": [
    {
      "key": "weather_api_key",
      "value": "a1b2c3d4e5f6g7h8i9j0",
      "enabled": true
    },
    {
      "key": "maps_api_key",
      "value": "AIzaSyB1234567890abcdefgh",
      "enabled": true
    }
  ]
}
```

**Request Configuration:**
- Key: `X-API-Key` (or `api_key` for query param)
- Value: `{{weather_api_key}}`
- Add To: **Header** (or **Query Params**)

Benefits:
- ✅ Easy environment switching
- ✅ Keep keys out of version control
- ✅ One key per API service
- ✅ Share collections without exposing keys

---

## Real-World Example: OpenWeatherMap API

### Step 1: Get API Key

1. Sign up at [https://openweathermap.org/api](https://openweathermap.org/api)
2. Go to API keys section
3. Copy your API key: `a1b2c3d4e5f6g7h8i9j0`

### Step 2: Configure Request (Query Parameter)

**Create Environment:**
- Name: `Weather API`
- Variable: `openweather_key` = `a1b2c3d4e5f6g7h8i9j0`

**Create Request:**
```
Method: GET
URL: https://api.openweathermap.org/data/2.5/weather
Query Params:
  - q: London
  - appid: {{openweather_key}}
  - units: metric
Auth Type: No Auth (key is in query params)
```

*Note: For OpenWeatherMap, the key goes in query params, not the Auth tab.*

### Step 3: Send Request

**Expected Response (200 OK):**
```json
{
  "coord": { "lon": -0.1257, "lat": 51.5085 },
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "clear sky",
      "icon": "01d"
    }
  ],
  "main": {
    "temp": 15.5,
    "feels_like": 14.8,
    "temp_min": 13.2,
    "temp_max": 17.1,
    "pressure": 1013,
    "humidity": 67
  },
  "name": "London",
  "cod": 200
}
```

**Test Script:**
```javascript
pm.test('Weather data retrieved', function() {
  pm.response.to.have.status(200);
});

pm.test('Response contains temperature', function() {
  const data = pm.response.json();
  pm.expect(data.main).to.have.property('temp');
  pm.expect(data.main.temp).to.be.a('number');
});

pm.test('City name is London', function() {
  const data = pm.response.json();
  pm.expect(data.name).to.equal('London');
});
```

### Example 4: Invalid API Key

**Change key to:** `invalid_key`

**Expected Response (401 Unauthorized):**
```json
{
  "cod": 401,
  "message": "Invalid API key. Please see https://openweathermap.org/faq#error401 for more info."
}
```

**Test Script:**
```javascript
pm.test('Invalid API key rejected', function() {
  pm.response.to.have.status(401);
  const error = pm.response.json();
  pm.expect(error.message).to.include('Invalid API key');
});
```

---

## Real-World Example: NewsAPI (Header-based)

### Step 1: Get API Key

1. Sign up at [https://newsapi.org](https://newsapi.org)
2. Get your API key: `abc123def456ghi789jkl`

### Step 2: Configure Request (Header)

**Environment:**
- `news_api_key` = `abc123def456ghi789jkl`

**Request:**
```
Method: GET
URL: https://newsapi.org/v2/top-headlines
Query Params:
  - country: us
  - category: technology
Auth Type: API Key
  - Key: X-Api-Key
  - Value: {{news_api_key}}
  - Add To: Header
```

### Step 3: Send Request

**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "totalResults": 38,
  "articles": [
    {
      "source": { "id": "techcrunch", "name": "TechCrunch" },
      "author": "Sarah Perez",
      "title": "New AI Model Breaks Records",
      "description": "Researchers announce breakthrough...",
      "url": "https://techcrunch.com/article",
      "publishedAt": "2024-03-15T10:30:00Z"
    }
  ]
}
```

**Test Script:**
```javascript
pm.test('News articles retrieved', function() {
  pm.response.to.have.status(200);
  const data = pm.response.json();
  pm.expect(data.status).to.equal('ok');
  pm.expect(data.articles).to.be.an('array');
  pm.expect(data.articles.length).to.be.above(0);
});

pm.test('Articles have required fields', function() {
  const articles = pm.response.json().articles;
  const firstArticle = articles[0];
  
  pm.expect(firstArticle).to.have.property('title');
  pm.expect(firstArticle).to.have.property('url');
  pm.expect(firstArticle).to.have.property('publishedAt');
});
```

---

## API Key in Different Locations

### Header (Most Common)

**Standard Headers:**
```
X-API-Key: your-api-key-here
X-Api-Key: your-api-key-here
API-Key: your-api-key-here
Authorization: ApiKey your-api-key-here
```

**Simba Configuration:**
```
Auth Type: API Key
Key: X-API-Key
Value: {{api_key}}
Add To: Header
```

### Query Parameter

**URL:**
```
https://api.example.com/data?api_key=your-api-key-here
```

**Simba Configuration:**
```
Query Params tab:
  - key: api_key
  - value: {{api_key}}
  - enabled: true
```

### Request Body (Less Common)

**JSON Body:**
```json
{
  "apiKey": "your-api-key-here",
  "query": "search term"
}
```

**Simba Configuration:**
```
Body tab → JSON
{
  "apiKey": "{{api_key}}",
  "query": "search term"
}
```

---

## Multiple API Keys Management

### Scenario: Testing Multiple Services

**Environment Variables:**
```json
{
  "name": "Production",
  "variables": [
    {
      "key": "weather_key",
      "value": "weather_api_key_123",
      "enabled": true
    },
    {
      "key": "maps_key",
      "value": "maps_api_key_456",
      "enabled": true
    },
    {
      "key": "news_key",
      "value": "news_api_key_789",
      "enabled": true
    }
  ]
}
```

**Collection Structure:**
```
📁 API Testing Collection
  📁 Weather API (uses {{weather_key}})
    ├── Get Current Weather
    └── Get 5-Day Forecast
  📁 Maps API (uses {{maps_key}})
    ├── Geocode Address
    └── Get Directions
  📁 News API (uses {{news_key}})
    ├── Top Headlines
    └── Search Articles
```

### Pre-request Script for Dynamic Key Selection

```javascript
// Select API key based on request URL
const url = pm.request.url.toString();

if (url.includes('openweathermap.org')) {
  pm.variables.set('current_api_key', pm.environment.get('weather_key'));
  console.log(' Using Weather API key');
} else if (url.includes('maps.googleapis.com')) {
  pm.variables.set('current_api_key', pm.environment.get('maps_key'));
  console.log('🗺️ Using Maps API key');
} else if (url.includes('newsapi.org')) {
  pm.variables.set('current_api_key', pm.environment.get('news_key'));
  console.log('📰 Using News API key');
}
```

**Auth Configuration:**
- Value: `{{current_api_key}}`

---

## API Key Rotation

### Automated Key Rotation Strategy

**Collection Variables:**
```json
{
  "api_key_primary": "key_abc123",
  "api_key_backup": "key_xyz789",
  "use_backup": false
}
```

**Pre-request Script:**
```javascript
const useBackup = pm.variables.get('use_backup');
const primaryKey = pm.variables.get('api_key_primary');
const backupKey = pm.variables.get('api_key_backup');

const currentKey = useBackup ? backupKey : primaryKey;
pm.variables.set('active_api_key', currentKey);

console.log(`🔑 Using ${useBackup ? 'backup' : 'primary'} API key`);
```

**Test Script (Fallback to Backup):**
```javascript
if (pm.response.code === 401 || pm.response.code === 403) {
  const useBackup = pm.variables.get('use_backup');
  
  if (!useBackup) {
    console.log('⚠️ Primary key failed. Retry with backup key.');
    pm.variables.set('use_backup', true);
    // In Collection Runner, this will use backup on next request
  } else {
    console.log('❌ Both keys failed. Update API keys.');
  }
}
```

---

## Rate Limiting with API Keys

Most API key-based services implement rate limiting:

### Monitoring Rate Limits

**Test Script:**
```javascript
// Check rate limit headers
const rateLimit = pm.response.headers.get('X-RateLimit-Limit');
const rateLimitRemaining = pm.response.headers.get('X-RateLimit-Remaining');
const rateLimitReset = pm.response.headers.get('X-RateLimit-Reset');

if (rateLimit) {
  console.log(`Rate Limit: ${rateLimitRemaining}/${rateLimit} remaining`);
  
  if (rateLimitReset) {
    const resetDate = new Date(parseInt(rateLimitReset) * 1000);
    console.log(`Resets at: ${resetDate.toLocaleString()}`);
  }
  
  // Warn if approaching limit
  if (parseInt(rateLimitRemaining) < 10) {
    console.log('⚠️ Approaching rate limit!');
  }
}
```

### Handling Rate Limit Errors (429)

**Test Script:**
```javascript
if (pm.response.code === 429) {
  const retryAfter = pm.response.headers.get('Retry-After');
  
  if (retryAfter) {
    console.log(`🕐 Rate limited. Retry after ${retryAfter} seconds`);
    pm.environment.set('retry_after_seconds', retryAfter);
  } else {
    console.log('🕐 Rate limited. Wait before retrying.');
  }
  
  pm.test('Rate limit exceeded', function() {
    pm.expect(pm.response.code).to.equal(429);
  });
}
```

---

## Security Best Practices

### ✅ DO:
- **Use HTTPS**: API keys should always be sent over secure connections
- **Store in environment variables**: Never hardcode keys
- **Rotate keys regularly**: Change keys every 3-6 months
- **Use different keys per environment**: Dev, staging, and prod should have separate keys
- **Limit key permissions**: Use restricted keys with minimal required permissions
- **Monitor key usage**: Track requests to detect unauthorized use
- **Revoke compromised keys immediately**: Most services allow instant revocation

### ❌ DON'T:
- **Don't commit keys to Git**: Add `.env` files to `.gitignore`
- **Don't share keys publicly**: Never post keys in forums or public repos
- **Don't reuse keys**: Each service should have its own key
- **Don't send keys in URLs** (when possible): Headers are more secure than query params
- **Don't log keys**: Avoid `console.log()` of full key values
- **Don't use keys client-side**: Mobile/web apps can expose keys; use backend proxy

---

## Common Scenarios

### Scenario 1: Client-Side vs Server-Side Keys

Some services (like Google Maps) have restricted keys:

**Browser-restricted key:**
```
Allowed referrers: https://yourdomain.com/*
Can be used in frontend JavaScript
```

**Server-restricted key:**
```
Allowed IP addresses: 203.0.113.10
Use in backend only
```

**Test both keys:**
```javascript
// Pre-request Script
const isBrowserTest = pm.variables.get('test_browser_key') || false;

if (isBrowserTest) {
  pm.variables.set('current_key', pm.environment.get('maps_browser_key'));
  // Add referrer header
  pm.request.headers.add({
    key: 'Referer',
    value: 'https://yourdomain.com/'
  });
} else {
  pm.variables.set('current_key', pm.environment.get('maps_server_key'));
}
```

### Scenario 2: Webhook Verification

Many webhook services use API keys for verification:

**Incoming Webhook Example:**
```javascript
// Pre-request Script (simulating webhook)
const webhookSecret = pm.environment.get('webhook_secret');
const payload = pm.request.body.raw;

// Create signature (example: HMAC-SHA256)
const CryptoJS = require('crypto-js');
const signature = CryptoJS.HmacSHA256(payload, webhookSecret).toString();

pm.request.headers.add({
  key: 'X-Webhook-Signature',
  value: signature
});

console.log('Generated signature:', signature);
```

### Scenario 3: API Key + IP Whitelist

Some APIs require both API key and IP whitelist:

**Test Script:**
```javascript
if (pm.response.code === 403) {
  const error = pm.response.json();
  
  if (error.message.includes('IP')) {
    console.log('❌ IP address not whitelisted');
    console.log('Add this IP to your API dashboard:');
    // You'd need to get this from your network
  } else if (error.message.includes('key')) {
    console.log('❌ Invalid API key');
  }
}
```

---

## Troubleshooting

### Invalid API Key (401/403)

**Symptom:**
```json
{
  "error": "Invalid API key",
  "code": 401
}
```

**Solutions:**
1. Verify key is correct (no spaces, complete string)
2. Check key hasn't expired or been revoked
3. Ensure key is for the correct environment
4. Verify key has required permissions
5. Check if service requires key activation period

### API Key Not Found in Request

**Symptom:**
```json
{
  "error": "API key missing",
  "message": "Please provide an API key"
}
```

**Solutions:**
1. Check Auth tab is configured correctly
2. Verify "Add To" is set to correct location (Header vs Query)
3. Check key name matches API requirements (`X-API-Key` vs `api_key`)
4. If using variable, ensure environment has the variable
5. Check Headers/Params tab to see actual request

### Rate Limit Exceeded (429)

**Symptom:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 60 seconds."
}
```

**Solutions:**
1. Wait for rate limit reset (check `Retry-After` header)
2. Reduce request frequency in Collection Runner
3. Upgrade to higher tier plan
4. Use multiple API keys with load balancing
5. Implement request caching

---

## Testing Checklist

- [ ] API key stored in environment variable (not hardcoded)
- [ ] Valid key returns 200 OK
- [ ] Invalid key returns 401/403
- [ ] Missing key returns 401/403
- [ ] Key is sent in correct location (header/query/body)
- [ ] Key name matches API requirements
- [ ] HTTPS is used (not HTTP)
- [ ] Rate limit headers are monitored
- [ ] Rate limit exceeded returns 429
- [ ] Different environments use different keys

---

## Related Topics

- [Bearer Token Authentication](bearer-token.md) - Token-based auth
- [Basic Authentication](basic-auth.md) - Username/password auth
- [OAuth 2.0](oauth2.md) - Third-party authorization
- [Environment Variables](../core-concepts/environments.md) - Manage API keys
- [Pre-request Scripts](../ Scripts](../advanced/pre-request-scripts.md) - Automate key selection
