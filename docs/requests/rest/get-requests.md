# GET Requests

**GET requests** retrieve data from an API without modifying server state. They're the most common HTTP method and form the foundation of API testing.

## What is a GET Request?

A GET request asks the server to return data. It's:

- **Safe**: Doesn't modify server data
- **Idempotent**: Multiple identical requests have the same effect
- **Cacheable**: Responses can be cached by browsers/proxies
- **No Body**: GET requests don't have a request body

**Examples**:
- Get a list of users
- Retrieve a single resource by ID
- Search or filter data
- Fetch configuration settings

---

## Creating a GET Request

![GET Request](../assets/screenshots/request-builder-get-method.png)

**To create a GET request:**

1. Click **+ New** → **New Request**
2. Select collection/folder
3. Configure:
   - **Name**: "Get All Users"
   - **Method**: GET
   - **URL**: `{{baseUrl}}/api/users`
4. Click **Create**

---

## Simple GET Request

### Basic Example

**Request**:
```
GET https://jsonplaceholder.typicode.com/users/1
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "city": "Gwenborough",
    "zipcode": "92998-3874"
  }
}
```

### With Variables

**Request**:
```
GET {{baseUrl}}/users/{{userId}}
```

**Pre-Request Script** (optional):
```javascript
// Set user ID dynamically
pm.environment.set('userId', '1');
```

---

## Query Parameters

GET requests use query parameters to filter, sort, or paginate data.

![Query Parameters](../assets/screenshots/params-tab.png)

### Adding Query Parameters

**In Params Tab**:

| Key | Value | Description |
|-----|-------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page |
| `sort` | `name` | Sort field |
| `order` | `asc` | Sort order |

**Resulting URL**:
```
https://api.example.com/users?page=1&limit=10&sort=name&order=asc
```

### Query Parameter Encoding

Special characters are automatically URL-encoded:

| Original | Encoded |
|----------|---------|
| `john doe` | `john%20doe` |
| `admin@example.com` | `admin%40example.com` |
| `a&b` | `a%26b` |
| `50%` | `50%25` |

### Array Parameters

**Different API styles**:

=== "Bracket notation"
    ```
    ?tags[]=javascript&tags[]=api&tags[]=testing
    ```

=== "Comma-separated"
    ```
    ?tags=javascript,api,testing
    ```

=== "Repeated keys"
    ```
    ?tags=javascript&tags=api&tags=testing
    ```

Check your API documentation for the correct format.

---

## GET Request Examples

### 1. List All Resources

**Get all users**:
```
GET {{baseUrl}}/users
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
]
```

**Test Script**:
```javascript
pm.test("Status code is 200", function() {
    pm.response.to.have.status(200);
});

pm.test("Response is an array", function() {
    const users = pm.response.json();
    pm.expect(users).to.be.an('array');
});

pm.test("Array contains users", function() {
    const users = pm.response.json();
    pm.expect(users.length).to.be.above(0);
});
```

### 2. Get Single Resource by ID

**Get user by ID**:
```
GET {{baseUrl}}/users/{{userId}}
```

**Response**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

**Test Script**:
```javascript
pm.test("User found", function() {
    pm.response.to.have.status(200);
});

pm.test("User has correct ID", function() {
    const user = pm.response.json();
    const expectedId = pm.environment.get('userId');
    pm.expect(user.id).to.equal(parseInt(expectedId));
});

pm.test("User has required fields", function() {
    const user = pm.response.json();
    pm.expect(user).to.have.all.keys('id', 'name', 'email', 'role');
});
```

### 3. Pagination

**Get paginated results**:
```
GET {{baseUrl}}/users?page={{page}}&limit={{limit}}
```

**Query Params**:
- `page`: 1, 2, 3, ...
- `limit`: 10, 20, 50, ...

**Response**:
```json
{
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Test Script**:
```javascript
pm.test("Pagination data present", function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('data');
    pm.expect(response).to.have.property('meta');
});

pm.test("Correct page size", function() {
    const response = pm.response.json();
    const limit = parseInt(pm.environment.get('limit'));
    pm.expect(response.data.length).to.be.at.most(limit);
});

pm.test("Pagination metadata valid", function() {
    const meta = pm.response.json().meta;
    pm.expect(meta.page).to.be.a('number');
    pm.expect(meta.total).to.be.a('number');
    pm.expect(meta.totalPages).to.be.a('number');
});
```

### 4. Filtering

**Filter by status**:
```
GET {{baseUrl}}/users?status=active&role=admin
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "status": "active",
    "role": "admin"
  }
]
```

**Test Script**:
```javascript
pm.test("All users match filter", function() {
    const users = pm.response.json();
    users.forEach(user => {
        pm.expect(user.status).to.equal('active');
        pm.expect(user.role).to.equal('admin');
    });
});
```

### 5. Sorting

**Sort by field**:
```
GET {{baseUrl}}/users?sort=name&order=asc
```

**Test Script**:
```javascript
pm.test("Results are sorted", function() {
    const users = pm.response.json();
    const names = users.map(u => u.name);
    const sorted = [...names].sort();
    pm.expect(names).to.deep.equal(sorted);
});
```

### 6. Searching

**Search by query**:
```
GET {{baseUrl}}/users/search?q={{searchQuery}}
```

**Query Params**:
- `q`: Search term (e.g., "john")

**Test Script**:
```javascript
pm.test("Search results match query", function() {
    const results = pm.response.json();
    const query = pm.environment.get('searchQuery').toLowerCase();
    
    results.forEach(user => {
        const name = user.name.toLowerCase();
        pm.expect(name).to.include(query);
    });
});
```

### 7. Nested Resources

**Get user's posts**:
```
GET {{baseUrl}}/users/{{userId}}/posts
```

**Response**:
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "First Post",
    "content": "Hello world"
  }
]
```

---

## Headers for GET Requests

### Common Headers

**Accept Header** (specify response format):
```
Accept: application/json
```

**Authorization**:
```
Authorization: Bearer {{authToken}}
```

**API Key**:
```
X-API-Key: {{apiKey}}
```

**Custom Headers**:
```
X-Request-ID: {{requestId}}
X-Client-Version: 1.0.0
```

### Header Example

| Header | Value |
|--------|-------|
| `Accept` | `application/json` |
| `Authorization` | `Bearer {{authToken}}` |
| `X-API-Key` | `{{apiKey}}` |
| `User-Agent` | `Simba/1.0` |

---

## Testing GET Requests

### Status Code Tests

```javascript
// Success
pm.test("Status is 200", function() {
    pm.response.to.have.status(200);
});

// Not found
pm.test("Status is 404", function() {
    pm.response.to.have.status(404);
});

// Unauthorized
pm.test("Status is 401", function() {
    pm.response.to.have.status(401);
});
```

### Response Structure Tests

```javascript
pm.test("Response is JSON", function() {
    pm.response.to.be.json;
});

pm.test("Response is array", function() {
    const data = pm.response.json();
    pm.expect(data).to.be.an('array');
});

pm.test("Response has expected fields", function() {
    const user = pm.response.json();
    pm.expect(user).to.have.property('id');
    pm.expect(user).to.have.property('name');
    pm.expect(user).to.have.property('email');
});
```

### Data Validation Tests

```javascript
pm.test("Email format is valid", function() {
    const user = pm.response.json();
    pm.expect(user.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});

pm.test("ID is positive integer", function() {
    const user = pm.response.json();
    pm.expect(user.id).to.be.a('number');
    pm.expect(user.id).to.be.above(0);
});

pm.test("Name is non-empty string", function() {
    const user = pm.response.json();
    pm.expect(user.name).to.be.a('string');
    pm.expect(user.name).to.have.lengthOf.at.least(1);
});
```

### Performance Tests

```javascript
pm.test("Response time under 500ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response size reasonable", function() {
    const sizeInKB = pm.response.responseSize / 1024;
    pm.expect(sizeInKB).to.be.below(100);
});
```

---

## Common GET Request Patterns

### Pattern 1: List → Detail Flow

**Step 1: Get list of users**
```
GET {{baseUrl}}/users
```

```javascript
// Extract first user ID
const users = pm.response.json();
pm.environment.set('userId', users[0].id);
```

**Step 2: Get user details**
```
GET {{baseUrl}}/users/{{userId}}
```

### Pattern 2: Search → Filter → Sort

**Search**:
```
GET /users/search?q=john
```

**Filter results**:
```
GET /users/search?q=john&status=active
```

**Sort results**:
```
GET /users/search?q=john&status=active&sort=name&order=asc
```

### Pattern 3: Pagination Loop

```javascript
// Pre-Request Script
let page = pm.collectionVariables.get('currentPage') || 1;
pm.collectionVariables.set('currentPage', page);

// Test Script
const response = pm.response.json();
if (response.meta.page < response.meta.totalPages) {
    // More pages available
    const nextPage = response.meta.page + 1;
    pm.collectionVariables.set('currentPage', nextPage);
    // In Collection Runner, this will fetch next page
}
```

---

## Error Handling

### 404 Not Found

```javascript
pm.test("Handles not found", function() {
    if (pm.response.code === 404) {
        const error = pm.response.json();
        pm.expect(error).to.have.property('message');
        pm.expect(error.message).to.include('not found');
    }
});
```

### 401 Unauthorized

```javascript
pm.test("Requires authentication", function() {
    if (pm.response.code === 401) {
        const error = pm.response.json();
        pm.expect(error.message).to.include('unauthorized');
        // Could trigger token refresh here
    }
});
```

### Rate Limiting

```javascript
pm.test("Check rate limit", function() {
    const remaining = pm.response.headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 10) {
        console.warn('Rate limit nearly exceeded!');
    }
});
```

---

## Best Practices

### URL Structure

✅ **Do**:
```
GET /users                    # List all
GET /users/123                # Get specific
GET /users/123/posts          # Nested resource
GET /users?status=active      # Filtering
```

❌ **Don't**:
```
GET /getUsers                 # Verb in URL
GET /users_list               # Unclear naming
GET /user/get/123             # Redundant
```

### Query Parameters

✅ **Do**:
- Use for filtering: `?status=active`
- Use for sorting: `?sort=name&order=asc`
- Use for pagination: `?page=1&limit=10`
- Use for search: `?q=searchterm`

❌ **Don't**:
- Put sensitive data in URLs
- Use excessively long parameter names
- Mix query param styles inconsistently

### Response Handling

✅ **Do**:
- Test for expected status codes
- Validate response structure
- Extract data for next requests
- Log important information

❌ **Don't**:
- Assume success status
- Skip validation tests
- Ignore error responses
- Leave debug logs in production

---

## Troubleshooting

### Request Returns Empty

**Check**:
- Is the resource actually available?
- Are filters too restrictive?
- Is pagination working correctly?

**Debug**:
```javascript
console.log('Request URL:', pm.request.url.toString());
console.log('Query params:', pm.request.url.query.toObject());
console.log('Response:', pm.response.json());
```

### 404 on Valid Resource

**Check**:
- URL path is correct
- Base URL variable is set
- Resource ID exists
- No typos in endpoint

### Unauthorized (401)

**Check**:
- Auth token is set: `console.log(pm.environment.get('authToken'))`
- Token hasn't expired
- Auth header is properly formatted

---

## Related Topics

<div class="grid cards" markdown>

-   :material-email:{ .lg .middle } **POST Requests**

    ---

    Create resources with POST requests

    [:octicons-arrow-right-24: POST Guide](post-requests.md)

-   :material-file-find:{ .lg .middle } **Query Parameters**

    ---

    Master query parameter usage

    [:octicons-arrow-right-24: Query Params Guide](query-params.md)

-   :material-file-document:{ .lg .middle } **Headers**

    ---

    Configure request headers

    [:octicons-arrow-right-24: Headers Guide](headers.md)

</div>

---

## Frequently Asked Questions

??? question "Can GET requests have a body?"
    Technically yes, but it's not recommended and many servers ignore it. Use query parameters instead.

??? question "What's the difference between GET and POST?"
    GET retrieves data (safe, cacheable, no body). POST creates data (not safe, not cacheable, has body).

??? question "How do I download files with GET?"
    GET requests can return any content type. Check the response body tab and use the download button.

??? question "Why is my GET request slow?"
    Check response time in test scripts. Causes: Large response, slow network, unindexed database queries.

??? question "Can I cache GET responses?"
    GET responses are cacheable by default. Check `Cache-Control` header in the response.

??? question "How do I handle pagination?"
    Use query parameters (`page`, `limit`) and check response metadata for total pages.
