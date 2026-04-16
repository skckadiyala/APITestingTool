# Query Parameters

Learn how to use query parameters to filter, sort, and paginate API requests.

---

## Overview

**Query parameters** are key-value pairs appended to the URL after a `?` to pass data to the server.

**Format:**
```
https://api.example.com/users?role=admin&status=active&page=2
```

**Use Cases:**
- 🔍 Filtering results
- 📊 Sorting data
- 📄 Pagination
- 🔎 Search queries
- ⚙️ Configuration options

---

## Basic Query Parameters

### Single Parameter

```
GET https://jsonplaceholder.typicode.com/comments?postId=1
```

**Result:** All comments for post ID 1

### Multiple Parameters

```
GET https://api.example.com/users?role=admin&status=active&verified=true
```

**Parameters:**
- `role=admin`
- `status=active`
- `verified=true`

---

## Adding Query Parameters in Simba

### Method 1: Params Tab

```
Request Builder → Params Tab

Key         Value       Description          Enabled
─────────   ─────────   ──────────────────   ───────
role        admin       Filter by role       ☑
status      active      Filter by status     ☑
limit       50          Results per page     ☑
offset      0           Pagination offset    ☐
```

**Generated URL:**
```
https://api.example.com/users?role=admin&status=active&limit=50
```

### Method 2: Direct in URL

```
URL: https://api.example.com/users?role={{userRole}}&status=active
```

### Method 3: Pre-request Script

```javascript
// Set query parameters dynamically
pm.request.url.query.add({
    key: 'timestamp',
    value: Date.now().toString()
});

pm.request.url.query.add({
    key: 'requestId',
    value: Math.random().toString(36).substring(7)
});

// Conditional parameters
if (pm.environment.get('enableFiltering')) {
    pm.request.url.query.add({
        key: 'status',
        value: 'active'
    });
}
```

---

## Filtering

### Exact Match

```
GET /users?email=john@example.com
GET /posts?userId=1&status=published
```

### Multiple Values (OR logic)

```
GET /users?role=admin&role=editor
GET /products?category=electronics&category=appliances
```

### Range Filters

```
GET /products?minPrice=100&maxPrice=500
GET /users?createdAfter=2026-01-01&createdBefore=2026-12-31
```

**Test Script:**
```javascript
pm.test("Products within price range", () => {
    const products = pm.response.json();
    const minPrice = parseInt(pm.request.url.query.get('minPrice'));
    const maxPrice = parseInt(pm.request.url.query.get('maxPrice'));
    
    products.forEach(product => {
        pm.expect(product.price).to.be.at.least(minPrice);
        pm.expect(product.price).to.be.at.most(maxPrice);
    });
});
```

---

## Sorting

### Basic Sorting

```
GET /users?sort=name
GET /posts?orderBy=createdAt
```

### Sort Direction

```
GET /users?sort=name&order=asc
GET /posts?sort=createdAt&order=desc
```

### Multiple Sort Fields

```
GET /users?sort=lastName,firstName&order=asc,asc
GET /products?sort=category,-price   // - prefix for descending
```

**Test Script:**
```javascript
pm.test("Results sorted correctly", () => {
    const users = pm.response.json();
    
    let previous = null;
    users.forEach(user => {
        if (previous) {
            pm.expect(user.name >= previous.name).to.be.true;
        }
        previous = user;
    });
    
    console.log('✅ Results sorted by name ascending');
});
```

---

## Pagination

### Offset-Based Pagination

```
GET /users?limit=20&offset=0    // Page 1
GET /users?limit=20&offset=20   // Page 2
GET /users?limit=20&offset=40   // Page 3
```

**Calculate offset:**
```javascript
const page = pm.collectionVariables.get('currentPage') || 1;
const limit = 20;
const offset = (page - 1) * limit;

pm.request.url.query.upsert({
    key: 'offset',
    value: offset.toString()
});
```

### Page-Based Pagination

```
GET /users?page=1&perPage=25
GET /users?page=2&perPage=25
```

**Auto-pagination:**
```javascript
pm.test("Load next page", () => {
    const data = pm.response.json();
    
    if (data.hasNextPage) {
        const currentPage = parseInt(pm.request.url.query.get('page'));
        pm.collectionVariables.set('nextPage', currentPage + 1);
        console.log(`Next page: ${currentPage + 1}`);
    } else {
        console.log('✅ All pages loaded');
        pm.collectionVariables.unset('nextPage');
    }
});
```

### Cursor-Based Pagination

```
GET /posts?limit=20
GET /posts?limit=20&cursor=eyJpZCI6MTAwfQ==
```

**Test Script:**
```javascript
pm.test("Save cursor for next page", () => {
    const response = pm.response.json();
    
    if (response.nextCursor) {
        pm.environment.set('cursor', response.nextCursor);
        console.log('Next cursor saved');
    } else {
        console.log('✅ Last page reached');
        pm.environment.unset('cursor');
    }
});
```

---

## Search

### Simple Search

```
GET /users?q=john
GET /posts?search=api+testing
```

### Field-Specific Search

```
GET /users?name=John&email=@example.com
GET /products?title_contains=laptop&description_contains=gaming
```

### Advanced Search Operators

```
GET /users?name_like=John*           // Starts with
GET /users?email_like=*@gmail.com    // Ends with
GET /posts?title_contains=API        // Contains
GET /products?price_gte=100          // Greater than or equal
GET /products?price_lt=500           // Less than
```

**Common Operators:**
- `_eq` - Equals
- `_ne` - Not equals
- `_gt` - Greater than
- `_gte` - Greater than or equal
- `_lt` - Less than
- `_lte` - Less than or equal
- `_like` - Pattern match
- `_contains` - Contains substring
- `_in` - In array

---

## Field Selection

### Include Specific Fields

```
GET /users?fields=id,name,email
GET /posts?select=id,title,author
```

**Test Script:**
```javascript
pm.test("Only requested fields returned", () => {
    const users = pm.response.json();
    const requestedFields = ['id', 'name', 'email'];
    
    users.forEach(user => {
        const actualFields = Object.keys(user);
        pm.expect(actualFields).to.have.lengthOf(requestedFields.length);
        
        requestedFields.forEach(field => {
            pm.expect(user).to.have.property(field);
        });
    });
});
```

### Exclude Fields

```
GET /users?exclude=password,createdAt,updatedAt
GET /posts?omit=content,metadata
```

---

## Nested/Related Resources

### Include Related Data

```
GET /posts?include=author,comments
GET /users?expand=profile,settings
GET /orders?embed=customer,items
```

**Response:**
```json
{
  "id": 1,
  "title": "My Post",
  "author": {
    "id": 5,
    "name": "John Doe"
  },
  "comments": [
    { "id": 10, "text": "Great post!" }
  ]
}
```

---

## Dynamic Query Parameters

### Build Parameters from Data

```javascript
// Pre-request script
const filters = pm.collectionVariables.get('filters') || {
    role: 'admin',
    status: 'active',
    verified: true
};

// Add each filter as query parameter
Object.keys(filters).forEach(key => {
    pm.request.url.query.add({
        key: key,
        value: filters[key].toString()
    });
});

console.log('Applied filters:', filters);
```

### Conditional Parameters

```javascript
// Only add parameters if environment variable is set
const userId = pm.environment.get('filterUserId');
if (userId) {
    pm.request.url.query.add({ key: 'userId', value: userId });
}

const startDate = pm.environment.get('startDate');
if (startDate) {
    pm.request.url.query.add({ key: 'from', value: startDate });
}
```

---

## URL Encoding

### Special Characters

Query parameters are automatically URL-encoded:

```
Space: %20 or +
@:     %40
#:     %23
&:     %26
=:     %3D
```

**Example:**
```
Input:  email=john+doe@example.com
Encoded: email=john%2Bdoe%40example.com
```

### Manual Encoding

```javascript
const searchQuery = "API & Testing (Advanced)";
const encoded = encodeURIComponent(searchQuery);

pm.request.url.query.add({
    key: 'q',
    value: encoded
});

// Result: q=API%20%26%20Testing%20%28Advanced%29
```

---

## Testing Query Parameters

### Validate Request Parameters

```javascript
pm.test("Required parameters present", () => {
    pm.expect(pm.request.url.query.has('page')).to.be.true;
    pm.expect(pm.request.url.query.has('limit')).to.be.true;
});

pm.test("Limit within acceptable range", () => {
    const limit = parseInt(pm.request.url.query.get('limit'));
    pm.expect(limit).to.be.at.least(1);
    pm.expect(limit).to.be.at.most(100);
});
```

### Validate Response Matches Parameters

```javascript
pm.test("Response matches filter parameters", () => {
    const status = pm.request.url.query.get('status');
    const users = pm.response.json();
    
    users.forEach(user => {
        pm.expect(user.status).to.equal(status);
    });
    
    console.log(`✅ All ${users.length} users have status: ${status}`);
});

pm.test("Result count matches limit", () => {
    const limit = parseInt(pm.request.url.query.get('limit'));
    const results = pm.response.json();
    
    pm.expect(results.length).to.be.at.most(limit);
});
```

---

## Best Practices

### ✅ DO

**Use descriptive parameter names:**
```
✅ ?status=active&role=admin
❌ ?s=a&r=a
```

**Use standard conventions:**
```
✅ ?page=1&limit=20
✅ ?sort=name&order=asc
❌ ?p=1&l=20
❌ ?orderBy=name&direction=ascending
```

**Provide defaults:**
```javascript
const limit = pm.request.url.query.get('limit') || '20';
const page = pm.request.url.query.get('page') || '1';
```

**Validate parameter values:**
```javascript
pm.test("Parameters valid", () => {
    const limit = parseInt(pm.request.url.query.get('limit'));
    pm.expect(limit).to.be.within(1, 100);
    
    const page = parseInt(pm.request.url.query.get('page'));
    pm.expect(page).to.be.at.least(1);
});
```

### ❌ DON'T

**Don't use query params for sensitive data:**
```
❌ ?password=secret123
❌ ?apiKey=sk_live_123
✅ Use headers or request body instead
```

**Don't make URLs too long:**
```
❌ ?filter[0][field]=name&filter[0][operator]=eq&filter[0][value]=John&...
✅ Use POST with request body for complex filters
```

**Don't ignore encoding:**
```javascript
// ❌ Bad
pm.request.url.query.add({ key: 'search', value: 'name@domain&param=val' });

// ✅ Good
pm.request.url.query.add({ 
    key: 'search', 
    value: encodeURIComponent('name@domain&param=val') 
});
```

---

## Common Patterns

### Pattern 1: Standard List Request

```
GET /users?
  page=1
  &limit=25
  &sort=createdAt
  &order=desc
  &status=active
```

### Pattern 2: Advanced Filtering

```
GET /products?
  category=electronics
  &minPrice=100
  &maxPrice=500
  &inStock=true
  &brand=Apple,Samsung
  &sort=price
  &order=asc
```

### Pattern 3: Search with Pagination

```
GET /posts?
  q=javascript
  &fields=title,excerpt,author
  &page=1
  &perPage=10
  &sort=relevance
```

---

## Query Parameter Collections

**Save common parameter sets:**

```javascript
// Collection variable: commonParams
{
  "pagination": {
    "page": "1",
    "limit": "25"
  },
  "activeUsersFilter": {
    "status": "active",
    "verified": "true"
  },
  "sortByDate": {
    "sort": "createdAt",
    "order": "desc"
  }
}

// Use in pre-request script
const commonParams = JSON.parse(pm.collectionVariables.get('commonParams'));
const params = { ...commonParams.pagination, ...commonParams.activeUsersFilter };

Object.keys(params).forEach(key => {
    pm.request.url.query.add({ key, value: params[key] });
});
```

---

## Related Topics

- [GET Requests](get-requests.md) - Using query params with GET
- [Headers](headers.md) - Alternative to query params
- [Request Body](request-body.md) - Complex filtering via POST
- [Variables](../../concepts/variables.md) - Using variables in parameters

---

*Need help? Check the [FAQ](../../reference/faq.md) or [Troubleshooting Guide](../../reference/troubleshooting.md)*
