# REST API Testing Tutorial

Build a complete REST API test suite from scratch using JSONPlaceholder, a free fake REST API. Learn request building, test scripts, environment variables, and automated testing workflows.

---

## Overview

**What you'll learn:**
- Send GET, POST, PUT, DELETE requests
- Write test scripts with assertions
- Use environment variables
- Chain requests with data extraction
- Build automated test collections
- Handle authentication
- Validate response schemas

**Prerequisites:**
- Simba installed and running
- Basic understanding of REST APIs
- Familiarity with JSON

**Time required:** 45 minutes

**API used:** [JSONPlaceholder](https://jsonplaceholder.typicode.com/) - Free fake REST API for testing

---

## Part 1: Setup

### Create Workspace and Collection

1. **Create new workspace:**
   ```
   Workspaces → + New Workspace
   Name: REST API Tutorial
   Description: Learning REST API testing with JSONPlaceholder
   ```

2. **Create collection:**
   ```
   Collections → + New Collection
   Name: JSONPlaceholder Tests
   Description: Complete REST API test suite
   ```

3. **Create environment:**
   ```
   Environments → + New Environment
   Name: JSONPlaceholder
   
   Variables:
     baseUrl:     https://jsonplaceholder.typicode.com
     userId:      1
     postId:      (empty - will be set dynamically)
   ```

4. **Activate environment:**
   ```
   Environment dropdown → Select "JSONPlaceholder"
   ```

---

## Part 2: GET Requests

### Test 1: Get All Posts

**Create request:**
```
Collection: JSONPlaceholder Tests
Request name: Get All Posts
Method: GET
URL: {{baseUrl}}/posts
```

**Add test script:**
```javascript
// Test: Response is successful
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

// Test: Response is an array
pm.test("Response is an array", () => {
    const posts = pm.response.json();
    pm.expect(posts).to.be.an('array');
});

// Test: Array has posts
pm.test("Array contains posts", () => {
    const posts = pm.response.json();
    pm.expect(posts.length).to.be.above(0);
});

// Test: First post has required fields
pm.test("Post has required fields", () => {
    const posts = pm.response.json();
    const firstPost = posts[0];
    
    pm.expect(firstPost).to.have.property('userId');
    pm.expect(firstPost).to.have.property('id');
    pm.expect(firstPost).to.have.property('title');
    pm.expect(firstPost).to.have.property('body');
});

// Test: Response time is acceptable
pm.test("Response time is acceptable", () => {
    pm.expect(pm.response.time).to.be.below(2000);
});
```

**Send request:**
```
Click "Send"

Response:
  Status: 200 OK
  Time: 245 ms
  Size: 15.2 KB

Body:
  [
    {
      "userId": 1,
      "id": 1,
      "title": "sunt aut facere repellat provident...",
      "body": "quia et suscipit\nsuscipit..."
    },
    {
      "userId": 1,
      "id": 2,
      "title": "qui est esse",
      "body": "est rerum tempore vitae..."
    },
    ...
  ]

Tests: ✅ 5/5 passed
```

### Test 2: Get Single Post

**Create request:**
```
Request name: Get Single Post
Method: GET
URL: {{baseUrl}}/posts/{{postId}}
```

**Add test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Response is an object", () => {
    const post = pm.response.json();
    pm.expect(post).to.be.an('object');
});

pm.test("Post ID matches requested ID", () => {
    const post = pm.response.json();
    const requestedId = pm.environment.get('postId') || 1;
    pm.expect(post.id).to.equal(parseInt(requestedId));
});

pm.test("Post has complete data", () => {
    const post = pm.response.json();
    
    pm.expect(post.title).to.be.a('string').and.not.empty;
    pm.expect(post.body).to.be.a('string').and.not.empty;
    pm.expect(post.userId).to.be.a('number');
});
```

**Send request:**
```
Response:
  Status: 200 OK
  
Body:
  {
    "userId": 1,
    "id": 1,
    "title": "sunt aut facere repellat provident...",
    "body": "quia et suscipit\nsuscipit recusandae..."
  }

Tests: ✅ 4/4 passed
```

### Test 3: Get Posts by User

**Create request:**
```
Request name: Get Posts by User
Method: GET
URL: {{baseUrl}}/posts?userId={{userId}}
```

**Add test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("All posts belong to requested user", () => {
    const posts = pm.response.json();
    const requestedUserId = parseInt(pm.environment.get('userId'));
    
    posts.forEach(post => {
        pm.expect(post.userId).to.equal(requestedUserId);
    });
});

pm.test("User has multiple posts", () => {
    const posts = pm.response.json();
    pm.expect(posts.length).to.be.above(1);
});
```

**Send request:**
```
Response:
  Status: 200 OK
  
Body:
  [
    { "userId": 1, "id": 1, "title": "...", "body": "..." },
    { "userId": 1, "id": 2, "title": "...", "body": "..." },
    { "userId": 1, "id": 3, "title": "...", "body": "..." },
    ...
  ]

Tests: ✅ 3/3 passed
```

---

## Part 3: POST Requests (Create)

### Test 4: Create New Post

**Create request:**
```
Request name: Create New Post
Method: POST
URL: {{baseUrl}}/posts
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "My Test Post",
  "body": "This is the content of my test post",
  "userId": 1
}
```

**Test script:**
```javascript
pm.test("Status code is 201 Created", () => {
    pm.response.to.have.status(201);
});

pm.test("Response contains created post", () => {
    const post = pm.response.json();
    
    pm.expect(post).to.have.property('id');
    pm.expect(post.title).to.equal('My Test Post');
    pm.expect(post.body).to.equal('This is the content of my test post');
    pm.expect(post.userId).to.equal(1);
});

pm.test("ID is generated", () => {
    const post = pm.response.json();
    pm.expect(post.id).to.be.a('number');
    
    // Save ID for next requests
    pm.environment.set('postId', post.id);
    console.log('Created post ID:', post.id);
});
```

**Send request:**
```
Response:
  Status: 201 Created
  
Body:
  {
    "title": "My Test Post",
    "body": "This is the content of my test post",
    "userId": 1,
    "id": 101
  }

Tests: ✅ 3/3 passed
Environment: postId = 101 (saved)
```

### Test 5: Create Post with Dynamic Data

**Pre-request script:**
```javascript
// Generate dynamic post data
const timestamp = Date.now();
const randomNum = Math.floor(Math.random() * 1000);

pm.environment.set('postTitle', `Test Post ${timestamp}`);
pm.environment.set('postBody', `Generated at ${new Date().toISOString()} - ID: ${randomNum}`);

console.log('Generated title:', pm.environment.get('postTitle'));
```

**Body (JSON):**
```json
{
  "title": "{{postTitle}}",
  "body": "{{postBody}}",
  "userId": {{userId}}
}
```

**Test script:**
```javascript
pm.test("Status code is 201", () => {
    pm.response.to.have.status(201);
});

pm.test("Created post matches request", () => {
    const post = pm.response.json();
    const requestTitle = pm.environment.get('postTitle');
    const requestBody = pm.environment.get('postBody');
    
    pm.expect(post.title).to.equal(requestTitle);
    pm.expect(post.body).to.equal(requestBody);
});
```

---

## Part 4: PUT Requests (Update - Replace)

### Test 6: Update Entire Post

**Create request:**
```
Request name: Update Post (PUT)
Method: PUT
URL: {{baseUrl}}/posts/{{postId}}
```

**Body (JSON):**
```json
{
  "id": {{postId}},
  "title": "Updated Post Title",
  "body": "This post has been completely updated",
  "userId": {{userId}}
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Post is updated", () => {
    const post = pm.response.json();
    
    pm.expect(post.title).to.equal('Updated Post Title');
    pm.expect(post.body).to.equal('This post has been completely updated');
    pm.expect(post.id).to.equal(parseInt(pm.environment.get('postId')));
});
```

**Send request:**
```
Response:
  Status: 200 OK
  
Body:
  {
    "id": 101,
    "title": "Updated Post Title",
    "body": "This post has been completely updated",
    "userId": 1
  }

Tests: ✅ 2/2 passed
```

---

## Part 5: PATCH Requests (Update - Partial)

### Test 7: Partially Update Post

**Create request:**
```
Request name: Update Post Title (PATCH)
Method: PATCH
URL: {{baseUrl}}/posts/{{postId}}
```

**Body (JSON):**
```json
{
  "title": "Partially Updated Title"
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Only title is updated", () => {
    const post = pm.response.json();
    
    // Title should be updated
    pm.expect(post.title).to.equal('Partially Updated Title');
    
    // Other fields should remain (in real API - JSONPlaceholder simulates this)
    pm.expect(post).to.have.property('body');
    pm.expect(post).to.have.property('userId');
});
```

---

## Part 6: DELETE Requests

### Test 8: Delete Post

**Create request:**
```
Request name: Delete Post
Method: DELETE
URL: {{baseUrl}}/posts/{{postId}}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Response confirms deletion", () => {
    const response = pm.response.json();
    
    // JSONPlaceholder returns empty object on delete
    pm.expect(response).to.be.an('object');
});

// Clean up environment variable
pm.environment.unset('postId');
console.log('Post deleted, postId cleared from environment');
```

**Send request:**
```
Response:
  Status: 200 OK
  
Body:
  {}

Tests: ✅ 2/2 passed
Environment: postId removed
```

---

## Part 7: Request Chaining

### Complete CRUD Workflow

**Create folder:** `CRUD Workflow`

**Request sequence:**
1. Create Post → Save ID
2. Get Created Post → Verify data
3. Update Post → Modify data
4. Verify Update → Check changes
5. Delete Post → Clean up

**Request 1: Create Post**
```
Test script:
  // Save created post ID
  const post = pm.response.json();
  pm.environment.set('crudPostId', post.id);
  pm.environment.set('crudPostTitle', post.title);
```

**Request 2: Get Created Post**
```
URL: {{baseUrl}}/posts/{{crudPostId}}

Test script:
  pm.test("Retrieved correct post", () => {
      const post = pm.response.json();
      const expectedTitle = pm.environment.get('crudPostTitle');
      pm.expect(post.title).to.equal(expectedTitle);
  });
```

**Request 3: Update Post**
```
Method: PUT
URL: {{baseUrl}}/posts/{{crudPostId}}

Body:
  {
    "id": {{crudPostId}},
    "title": "Updated in CRUD Workflow",
    "body": "Modified content",
    "userId": 1
  }

Test script:
  // Save updated title for verification
  const post = pm.response.json();
  pm.environment.set('crudUpdatedTitle', post.title);
```

**Request 4: Verify Update**
```
URL: {{baseUrl}}/posts/{{crudPostId}}

Test script:
  pm.test("Update persisted", () => {
      const post = pm.response.json();
      const expectedTitle = pm.environment.get('crudUpdatedTitle');
      pm.expect(post.title).to.equal(expectedTitle);
  });
```

**Request 5: Delete Post**
```
Method: DELETE
URL: {{baseUrl}}/posts/{{crudPostId}}

Test script:
  pm.test("Post deleted successfully", () => {
      pm.response.to.have.status(200);
  });
  
  // Clean up
  pm.environment.unset('crudPostId');
  pm.environment.unset('crudPostTitle');
  pm.environment.unset('crudUpdatedTitle');
```

**Run workflow:**
```
Collection Runner:
  Folder: CRUD Workflow
  Environment: JSONPlaceholder
  Iterations: 1

Results:
  ✅ Request 1: Create Post - 3/3 tests passed
  ✅ Request 2: Get Created Post - 2/2 tests passed
  ✅ Request 3: Update Post - 2/2 tests passed
  ✅ Request 4: Verify Update - 1/1 tests passed
  ✅ Request 5: Delete Post - 1/1 tests passed
  
  Total: 9/9 tests passed
  Duration: 1.2 seconds
```

---

## Part 8: Advanced Testing

### Response Schema Validation

**Test: Validate post schema**
```javascript
pm.test("Post matches expected schema", () => {
    const post = pm.response.json();
    
    // Define expected schema
    const expectedSchema = {
        userId: 'number',
        id: 'number',
        title: 'string',
        body: 'string'
    };
    
    // Validate each field
    Object.keys(expectedSchema).forEach(key => {
        pm.expect(post).to.have.property(key);
        pm.expect(typeof post[key]).to.equal(expectedSchema[key]);
    });
});
```

### Pagination Testing

**Request: Get posts with pagination**
```
URL: {{baseUrl}}/posts?_page=1&_limit=10

Test script:
pm.test("Returns exactly 10 posts", () => {
    const posts = pm.response.json();
    pm.expect(posts).to.have.lengthOf(10);
});

pm.test("Pagination headers present", () => {
    // Check for pagination-related headers (API-specific)
    pm.response.to.have.header('X-Total-Count');
});
```

### Error Handling

**Request: Get non-existent post**
```
URL: {{baseUrl}}/posts/99999

Test script:
pm.test("Non-existent post returns 404", () => {
    // Note: JSONPlaceholder returns 404 for non-existent resources
    // Real APIs may vary
    pm.expect([200, 404]).to.include(pm.response.code);
});

pm.test("Response handles error gracefully", () => {
    const response = pm.response.json();
    // JSONPlaceholder returns {} for non-existent resources
    pm.expect(response).to.be.an('object');
});
```

### Performance Testing

**Collection pre-request script:**
```javascript
// Track request start time
pm.environment.set('requestStartTime', Date.now());
```

**Collection test script (runs after every request):**
```javascript
// Calculate response time
const startTime = pm.environment.get('requestStartTime');
const responseTime = Date.now() - startTime;

pm.test(`Response time under 2 seconds (${responseTime}ms)`, () => {
    pm.expect(responseTime).to.be.below(2000);
});

// Log performance
console.log(`Request: ${pm.info.requestName} - ${responseTime}ms`);
```

---

## Part 9: Collection Organization

### Final Collection Structure

```
📁 JSONPlaceholder Tests
  📂 GET Requests
    ├── Get All Posts
    ├── Get Single Post
    └── Get Posts by User
  
  📂 POST Requests
    ├── Create New Post
    └── Create Post with Dynamic Data
  
  📂 PUT/PATCH Requests
    ├── Update Post (PUT)
    └── Update Post Title (PATCH)
  
  📂 DELETE Requests
    └── Delete Post
  
  📂 CRUD Workflow
    ├── 1. Create Post
    ├── 2. Get Created Post
    ├── 3. Update Post
    ├── 4. Verify Update
    └── 5. Delete Post
  
  📂 Advanced Tests
    ├── Schema Validation
    ├── Pagination
    ├── Error Handling
    └── Performance Test
```

---

## Part 10: Running Automated Tests

### Run Entire Collection

```
Collection Runner:
  Collection: JSONPlaceholder Tests
  Environment: JSONPlaceholder
  Iterations: 1
  Delay: 100ms between requests
  
[Run Collection]

Results:
  📊 Summary:
    Total Requests: 15
    Passed Tests: 42/43 (97.7%)
    Failed Tests: 1
    Duration: 3.8 seconds
    
  ✅ GET Requests: 12/12 passed
  ✅ POST Requests: 6/6 passed
  ✅ PUT/PATCH Requests: 4/4 passed
  ✅ DELETE Requests: 2/2 passed
  ✅ CRUD Workflow: 9/9 passed
  ⚠️  Advanced Tests: 9/10 passed
    ❌ Performance Test: Response time exceeded (2.3s)
```

### Run Specific Folder

```
Collection Runner:
  Folder: CRUD Workflow
  Run Order: Sequential
  
Results:
  ✅ 9/9 tests passed
  Perfect! Ready for CI/CD integration
```

---

## Best Practices Applied

### ✅ Environment Variables

```
Instead of:
  URL: https://jsonplaceholder.typicode.com/posts/1

Use:
  URL: {{baseUrl}}/posts/{{postId}}
  
Benefits:
  - Easy to switch environments
  - Reusable across requests
  - Dynamic data from previous requests
```

### ✅ Descriptive Test Names

```
Good:
  pm.test("Post ID matches requested ID", () => { ... });

Bad:
  pm.test("Test 1", () => { ... });
```

### ✅ Comprehensive Assertions

```
Instead of:
  pm.response.to.have.status(200);

Add:
  pm.test("Status code is 200", () => {
      pm.response.to.have.status(200);
  });
  
  pm.test("Response time is acceptable", () => {
      pm.expect(pm.response.time).to.be.below(2000);
  });
  
  pm.test("Response has required fields", () => {
      const post = pm.response.json();
      pm.expect(post).to.have.all.keys('userId', 'id', 'title', 'body');
  });
```

### ✅ Request Chaining

```
Save data from responses:
  const post = pm.response.json();
  pm.environment.set('postId', post.id);

Use in next request:
  URL: {{baseUrl}}/posts/{{postId}}
```

### ✅ Clean Up

```
After test completion:
  pm.environment.unset('postId');
  pm.environment.unset('postTitle');
```

---

## Next Steps

**Expand your test suite:**
1. Test other JSONPlaceholder resources (users, comments, albums)
2. Add negative test cases (invalid IDs, malformed JSON)
3. Test edge cases (empty strings, special characters, very long content)
4. Add data-driven tests with CSV files

**Integrate with real APIs:**
1. Replace JSONPlaceholder with your actual API
2. Add authentication (see [Authentication tutorials](../authentication/bearer-token.md))
3. Test against multiple environments (dev, staging, prod)

**Automate:**
1. Set up CI/CD integration (see [Azure DevOps CI/CD tutorial](cicd-integration.md))
2. Schedule collection runs
3. Set up monitoring and alerts

---

## Related Topics

- [Collections](../core-concepts/collections.md) - Organize requests effectively
- [Test Scripts](../advanced/test-scripts.md) - Advanced test script techniques
- [Collection Runner](../advanced/collection-runner.md) - Automated test execution
- [Environments](../core-concepts/environments.md) - Manage environments
- [GraphQL Testing Tutorial](graphql-testing.md) - Test GraphQL APIs
- [CI/CD Integration](cicd-integration.md) - Automate with Azure DevOps
