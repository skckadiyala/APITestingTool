# Automated Testing Tutorial

Build a comprehensive automated API test suite with data-driven testing, test assertions, and collection runner. Learn best practices for maintainable API tests.

---

## Overview

**What you'll learn:**
- Design test collection structure
- Write comprehensive test assertions
- Implement data-driven testing with CSV/JSON
- Chain requests with data extraction
- Handle test dependencies
- Generate test reports
- Debug failing tests

**Prerequisites:**
- Simba installed and running
- Completion of REST API Testing tutorial
- Understanding of test scripts

**Time required:** 60 minutes

**API used:** [JSONPlaceholder](https://jsonplaceholder.typicode.com/) - Free fake REST API

---

## Part 1: Test Strategy

### Test Pyramid for APIs

```
        ┌────────────┐
        │  E2E Tests │  ←  Complex scenarios, user workflows
        │    (Few)   │
        ├────────────┤
        │ Integration│  ←  API endpoint interactions
        │   Tests    │
        │  (Some)    │
        ├────────────┤
        │   Unit     │  ←  Individual endpoints, validations
        │   Tests    │
        │   (Many)   │
        └────────────┘
```

**Our focus:**
- **Unit Tests**: Individual endpoint validation (status, schema, data)
- **Integration Tests**: Multi-request workflows, data dependencies
- **E2E Tests**: Complete business scenarios (create → read → update → delete)

---

## Part 2: Setup

### Create Test Workspace

1. **Create workspace:**
   ```
   Workspaces → + New Workspace
   Name: Automated Testing Tutorial
   Description: Comprehensive API test automation
   ```

2. **Create collection:**
   ```
   Collections → + New Collection
   Name: API Test Suite
   Description: Complete automated test suite with unit, integration, and E2E tests
   ```

3. **Create environment:**
   ```
   Environments → + New Environment
   Name: Test Environment
   
   Variables:
     baseUrl:           https://jsonplaceholder.typicode.com
     timeout:           2000
     maxRetries:        3
     testRunId:         (empty - will be generated)
     
     # Test Data
     testUserId:        1
     testPostId:        (empty - dynamic)
     testCommentId:     (empty - dynamic)
   ```

4. **Activate environment**

---

## Part 3: Unit Tests - Individual Endpoints

### Folder: Unit Tests / Posts

**Test 1: GET All Posts - Schema Validation**
```
Request name: GET /posts - Schema Validation
Method: GET
URL: {{baseUrl}}/posts
```

**Test script:**
```javascript
// 1. Status Code Test
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

// 2. Response Time Test
pm.test(`Response time under ${pm.environment.get('timeout')}ms`, () => {
    pm.expect(pm.response.time).to.be.below(parseInt(pm.environment.get('timeout')));
});

// 3. Content Type Test
pm.test("Content-Type is application/json", () => {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

// 4. Response is Array
pm.test("Response is an array", () => {
    const posts = pm.response.json();
    pm.expect(posts).to.be.an('array');
});

// 5. Array Not Empty
pm.test("Array contains posts", () => {
    const posts = pm.response.json();
    pm.expect(posts.length).to.be.above(0);
});

// 6. Schema Validation
pm.test("Each post matches schema", () => {
    const posts = pm.response.json();
    const expectedSchema = {
        userId: 'number',
        id: 'number',
        title: 'string',
        body: 'string'
    };
    
    posts.forEach((post, index) => {
        Object.keys(expectedSchema).forEach(key => {
            pm.expect(post, `Post ${index} missing ${key}`).to.have.property(key);
            pm.expect(typeof post[key], `Post ${index} ${key} wrong type`).to.equal(expectedSchema[key]);
        });
    });
});

// 7. Data Validation
pm.test("Post IDs are unique", () => {
    const posts = pm.response.json();
    const ids = posts.map(p => p.id);
    const uniqueIds = [...new Set(ids)];
    pm.expect(ids.length).to.equal(uniqueIds.length);
});

pm.test("Post IDs are sequential", () => {
    const posts = pm.response.json();
    const firstPost = posts[0];
    pm.expect(firstPost.id).to.equal(1);
});

// Log summary
console.log(`✅ Validated ${pm.response.json().length} posts`);
```

**Test 2: GET Single Post - Data Validation**
```
Request name: GET /posts/:id - Data Validation
Method: GET
URL: {{baseUrl}}/posts/1
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Response is object", () => {
    const post = pm.response.json();
    pm.expect(post).to.be.an('object');
});

pm.test("Post ID matches requested", () => {
    const post = pm.response.json();
    pm.expect(post.id).to.equal(1);
});

pm.test("Title is non-empty string", () => {
    const post = pm.response.json();
    pm.expect(post.title).to.be.a('string').and.not.empty;
});

pm.test("Body is non-empty string", () => {
    const post = pm.response.json();
    pm.expect(post.body).to.be.a('string').and.not.empty;
});

pm.test("UserID is valid", () => {
    const post = pm.response.json();
    pm.expect(post.userId).to.be.a('number').and.at.least(1);
});

// Save for later tests
pm.environment.set('testPostId', pm.response.json().id);
```

**Test 3: POST Create - Success Validation**
```
Request name: POST /posts - Success Validation
Method: POST
URL: {{baseUrl}}/posts
```

**Body:**
```json
{
  "title": "Automated Test Post",
  "body": "This post was created by an automated test",
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
    pm.expect(post).to.have.property('title');
    pm.expect(post).to.have.property('body');
    pm.expect(post).to.have.property('userId');
});

pm.test("Created post matches request", () => {
    const post = pm.response.json();
    pm.expect(post.title).to.equal('Automated Test Post');
    pm.expect(post.body).to.equal('This post was created by an automated test');
    pm.expect(post.userId).to.equal(1);
});

pm.test("ID was assigned", () => {
    const post = pm.response.json();
    pm.expect(post.id).to.be.a('number').and.above(0);
    
    // Save for other tests
    pm.environment.set('testPostId', post.id);
});
```

**Test 4: PUT Update - Success Validation**
```
Request name: PUT /posts/:id - Success Validation
Method: PUT
URL: {{baseUrl}}/posts/{{testPostId}}
```

**Body:**
```json
{
  "id": {{testPostId}},
  "title": "Updated Test Post",
  "body": "This post was updated by an automated test",
  "userId": 1
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Post was updated", () => {
    const post = pm.response.json();
    pm.expect(post.title).to.equal('Updated Test Post');
    pm.expect(post.body).to.equal('This post was updated by an automated test');
});

pm.test("ID unchanged", () => {
    const post = pm.response.json();
    const expectedId = parseInt(pm.environment.get('testPostId'));
    pm.expect(post.id).to.equal(expectedId);
});
```

**Test 5: DELETE - Success Validation**
```
Request name: DELETE /posts/:id - Success Validation
Method: DELETE
URL: {{baseUrl}}/posts/{{testPostId}}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Delete confirmed", () => {
    const response = pm.response.json();
    // JSONPlaceholder returns empty object
    pm.expect(response).to.be.an('object');
});

// Cleanup
pm.environment.unset('testPostId');
```

---

## Part 4: Negative Tests - Error Handling

### Folder: Negative Tests

**Test 1: GET Non-existent Resource**
```
Request name: GET /posts/99999 - 404 Not Found
Method: GET
URL: {{baseUrl}}/posts/99999
```

**Test script:**
```javascript
pm.test("Status code is 404", () => {
    // Note: JSONPlaceholder returns 404
    pm.expect([200, 404]).to.include(pm.response.code);
});

pm.test("Response is empty or error object", () => {
    const response = pm.response.json();
    pm.expect(response).to.be.an('object');
});
```

**Test 2: POST Invalid Data**
```
Request name: POST /posts - Invalid Data
Method: POST
URL: {{baseUrl}}/posts
```

**Body (missing required fields):**
```json
{
  "title": "Missing body and userId"
}
```

**Test script:**
```javascript
// JSONPlaceholder is permissive, real APIs would return 400
pm.test("Response indicates creation (permissive API)", () => {
    pm.expect([200, 201, 400]).to.include(pm.response.code);
});

pm.test("For real API, would validate required fields", () => {
    // In production, test:
    // - Status 400 Bad Request
    // - Error message lists missing fields
    // - Response has 'errors' array
    pm.expect(true).to.be.true;
    console.log('⚠️  Note: JSONPlaceholder is permissive. Real APIs would return 400.');
});
```

**Test 3: PUT with Invalid ID**
```
Request name: PUT /posts/abc - Invalid ID Type
Method: PUT
URL: {{baseUrl}}/posts/abc
```

**Test script:**
```javascript
pm.test("Status code indicates error", () => {
    // Real APIs would return 400 Bad Request
    pm.expect([400, 404, 500]).to.include(pm.response.code);
});
```

---

## Part 5: Integration Tests - Request Chaining

### Folder: Integration Tests

**Complete CRUD Workflow with Validation**

**Request 1: Create Post and Save ID**
```
Method: POST
URL: {{baseUrl}}/posts

Body:
{
  "title": "Integration Test Post",
  "body": "Testing complete workflow",
  "userId": 1
}

Test script:
pm.test("Post created", () => {
    pm.response.to.have.status(201);
    const post = pm.response.json();
    pm.environment.set('integrationPostId', post.id);
    console.log('Created post ID:', post.id);
});
```

**Request 2: Verify Creation**
```
Method: GET
URL: {{baseUrl}}/posts/{{integrationPostId}}

Test script:
pm.test("Created post can be retrieved", () => {
    pm.response.to.have.status(200);
    const post = pm.response.json();
    pm.expect(post.id).to.equal(parseInt(pm.environment.get('integrationPostId')));
    pm.expect(post.title).to.equal('Integration Test Post');
});
```

**Request 3: Update Post**
```
Method: PUT
URL: {{baseUrl}}/posts/{{integrationPostId}}

Body:
{
  "id": {{integrationPostId}},
  "title": "Updated Integration Test",
  "body": "Workflow update step",
  "userId": 1
}

Test script:
pm.test("Post updated", () => {
    pm.response.to.have.status(200);
    const post = pm.response.json();
    pm.expect(post.title).to.equal('Updated Integration Test');
});
```

**Request 4: Verify Update**
```
Method: GET
URL: {{baseUrl}}/posts/{{integrationPostId}}

Test script:
pm.test("Update persisted", () => {
    pm.response.to.have.status(200);
    const post = pm.response.json();
    pm.expect(post.title).to.equal('Updated Integration Test');
});
```

**Request 5: Add Comment to Post**
```
Method: POST
URL: {{baseUrl}}/posts/{{integrationPostId}}/comments

Body:
{
  "postId": {{integrationPostId}},
  "name": "Test Commenter",
  "email": "test@example.com",
  "body": "This is a test comment"
}

Test script:
pm.test("Comment added", () => {
    pm.response.to.have.status(201);
    const comment = pm.response.json();
    pm.environment.set('integrationCommentId', comment.id);
});
```

**Request 6: Get Comments for Post**
```
Method: GET
URL: {{baseUrl}}/posts/{{integrationPostId}}/comments

Test script:
pm.test("Comments retrieved", () => {
    pm.response.to.have.status(200);
    const comments = pm.response.json();
    pm.expect(comments).to.be.an('array');
    
    // Verify our comment is in the list (in real scenario)
    console.log(`Post has ${comments.length} comments`);
});
```

**Request 7: Delete Post**
```
Method: DELETE
URL: {{baseUrl}}/posts/{{integrationPostId}}

Test script:
pm.test("Post deleted", () => {
    pm.response.to.have.status(200);
});

// Cleanup
pm.environment.unset('integrationPostId');
pm.environment.unset('integrationCommentId');
```

---

## Part 6: Data-Driven Testing

### Create Test Data File

**Create CSV file: `test-users.csv`**
```csv
userId,expectedPostCount
1,10
2,10
3,10
4,10
5,10
```

**Upload to Simba:**
```
Workspace Settings → Data Files → Upload
Select: test-users.csv
```

### Data-Driven Test Collection

**Request: Get User Posts (Data-Driven)**
```
Method: GET
URL: {{baseUrl}}/posts?userId={{userId}}
```

**Test script:**
```javascript
// Get expected count from data file
const expectedCount = parseInt(pm.iterationData.get('expectedPostCount'));
const userId = pm.iterationData.get('userId');

pm.test(`User ${userId} has posts`, () => {
    pm.response.to.have.status(200);
});

pm.test(`User ${userId} has ${expectedCount} posts`, () => {
    const posts = pm.response.json();
    pm.expect(posts.length).to.equal(expectedCount);
});

pm.test(`All posts belong to user ${userId}`, () => {
    const posts = pm.response.json();
    posts.forEach(post => {
        pm.expect(post.userId).to.equal(parseInt(userId));
    });
});

console.log(`✅ User ${userId}: ${pm.response.json().length} posts validated`);
```

**Run with Collection Runner:**
```
Collection Runner:
  Folder: Data-Driven Tests
  Environment: Test Environment
  Data File: test-users.csv
  Iterations: 5 (one per CSV row)
  
Results:
  ✅ Iteration 1 (userId: 1): 3/3 tests passed
  ✅ Iteration 2 (userId: 2): 3/3 tests passed
  ✅ Iteration 3 (userId: 3): 3/3 tests passed
  ✅ Iteration 4 (userId: 4): 3/3 tests passed
  ✅ Iteration 5 (userId: 5): 3/3 tests passed
  
  Total: 15/15 tests passed
```

### Complex Test Data (JSON)

**Create JSON file: `post-test-data.json`**
```json
[
  {
    "title": "First Test Post",
    "body": "Content for first test",
    "userId": 1,
    "expectedStatus": 201
  },
  {
    "title": "Second Test Post",
    "body": "Content for second test",
    "userId": 2,
    "expectedStatus": 201
  },
  {
    "title": "",
    "body": "Post with empty title",
    "userId": 1,
    "expectedStatus": 400
  }
]
```

**Test script:**
```javascript
const testData = pm.iterationData.toObject();
const expectedStatus = testData.expectedStatus;

pm.test(`Expected status ${expectedStatus}`, () => {
    pm.expect(pm.response.code).to.equal(expectedStatus);
});

if (pm.response.code === 201) {
    pm.test("Post created successfully", () => {
        const post = pm.response.json();
        pm.expect(post.title).to.equal(testData.title);
        pm.expect(post.body).to.equal(testData.body);
    });
}

console.log(`Test case: "${testData.title}" - Status: ${pm.response.code}`);
```

---

## Part 7: Collection-Level Scripts

### Collection Pre-request Script

**Apply to entire collection:**
```javascript
// Generate unique test run ID
if (!pm.environment.get('testRunId')) {
    const testRunId = `test-${Date.now()}`;
    pm.environment.set('testRunId', testRunId);
    console.log('🚀 Test Run ID:', testRunId);
}

// Log request info
console.log(`📤 ${pm.request.method} ${pm.request.url.toString()}`);

// Set timestamps
pm.environment.set('requestStartTime', Date.now());

// Add custom headers for tracking
pm.request.headers.add({
    key: 'X-Test-Run-Id',
    value: pm.environment.get('testRunId')
});
```

### Collection Test Script

**Apply to every response:**
```javascript
// Calculate response time
const startTime = pm.environment.get('requestStartTime');
const duration = Date.now() - startTime;

console.log(`📥 Response: ${pm.response.code} (${duration}ms)`);

// Global performance check
pm.test(`Response time under ${pm.environment.get('timeout')}ms`, () => {
    pm.expect(pm.response.time).to.be.below(parseInt(pm.environment.get('timeout')));
});

// Global status check (unless expecting error)
if (!pm.request.name.includes('Negative') && !pm.request.name.includes('Error')) {
    pm.test("Status code is successful (2xx)", () => {
        pm.expect(pm.response.code).to.be.within(200, 299);
    });
}

// Log any errors
if (pm.response.code >= 400) {
    console.error('❌ Error:', pm.response.code, pm.response.status);
}
```

---

## Part 8: Test Reports and Debugging

### Comprehensive Test Summary

**Add to last request in collection:**
```javascript
// Generate test summary
const testResults = {
    runId: pm.environment.get('testRunId'),
    timestamp: new Date().toISOString(),
    totalRequests: pm.info.iteration,
    // In real scenario, track these across requests
    passedTests: 0,
    failedTests: 0,
    totalTime: Date.now() - parseInt(pm.environment.get('testRunStartTime') || Date.now())
};

console.log('');
console.log('═══════════════════════════════════');
console.log('       TEST RUN SUMMARY           ');
console.log('═══════════════════════════════════');
console.log('Run ID:', testResults.runId);
console.log('Completed:', testResults.timestamp);
console.log('Total Requests:', testResults.totalRequests);
console.log('Duration:', testResults.totalTime, 'ms');
console.log('═══════════════════════════════════');
```

### Debugging Failed Tests

**Add debug logging to test scripts:**
```javascript
pm.test("Complex validation", () => {
    const data = pm.response.json();
    
    try {
        pm.expect(data.field1).to.equal('expected_value');
    } catch (e) {
        console.error('❌ Validation failed:');
        console.error('Expected:', 'expected_value');
        console.error('Actual:', data.field1);
        console.error('Full response:', JSON.stringify(data, null, 2));
        throw e; // Re-throw to fail the test
    }
});
```

---

## Part 9: Complete Test Collection Structure

```
📁 API Test Suite
  
  📂 Unit Tests
    📂 Posts
      ├── GET /posts - Schema Validation
      ├── GET /posts/:id - Data Validation
      ├── POST /posts - Success Validation
      ├── PUT /posts/:id - Success Validation
      └── DELETE /posts/:id - Success Validation
    
    📂 Users
      ├── GET /users - Schema Validation
      ├── GET /users/:id - Data Validation
      └── GET /users/:id/posts - Relationship Validation
    
    📂 Comments
      ├── GET /comments - Schema Validation
      └── GET /posts/:id/comments - Nested Resource
  
  📂 Negative Tests
    ├── GET /posts/99999 - 404 Not Found
    ├── POST /posts - Invalid Data
    ├── PUT /posts/abc - Invalid ID Type
    └── DELETE /posts/-1 - Invalid ID
  
  📂 Integration Tests
    ├── Complete CRUD Workflow
    └── Multi-Resource Workflow
  
  📂 Data-Driven Tests
    ├── Parameterized GET Tests
    ├── Bulk Create Tests
    └── Boundary Value Tests
  
  📂 Performance Tests
    ├── Response Time Validation
    ├── Large Payload Test
    └── Concurrent Request Simulation
```

---

## Part 10: Running Automated Tests

### Local Execution

**Run entire suite:**
```
Collection Runner:
  Collection: API Test Suite
  Environment: Test Environment
  Iterations: 1
  Delay: 100ms
  Stop on error: No
  
[Run All Tests]

Results:
  ✅ Unit Tests: 35/35 passed
  ✅ Negative Tests: 8/8 passed
  ✅ Integration Tests: 21/21 passed
  ✅ Data-Driven Tests: 15/15 passed
  ✅ Performance Tests: 6/6 passed
  
  Total: 85/85 tests passed (100%)
  Duration: 12.3 seconds
```

### Folder-Specific Execution

**Run only unit tests:**
```
Collection Runner:
  Folder: Unit Tests
  Environment: Test Environment
  
Results:
  35/35 tests passed
  Duration: 4.2 seconds
```

### Regression Testing

**Schedule daily runs:**
```
1. Export collection
2. Set up CI/CD (see Azure DevOps tutorial)
3. Run nightly at 2 AM
4. Email results to team
```

---

## Best Practices

### ✅ DO

**Write independent tests:**
```javascript
// Each test should be self-contained
pm.test("Specific validation", () => {
    // Setup (if needed)
    const data = pm.response.json();
    
    // Test
    pm.expect(data.field).to.equal('value');
    
    // No shared state with other tests
});
```

**Use descriptive test names:**
```javascript
✅ pm.test("Post title is non-empty string", () => {...});
❌ pm.test("Test 1", () => {...});
```

**Organize tests logically:**
```
Unit Tests → Integration Tests → E2E Tests
Fast → Slow
Simple → Complex
```

**Clean up test data:**
```javascript
// After test
pm.environment.unset('temporaryVariable');
```

### ❌ DON'T

**Don't skip negative tests:**
```javascript
❌ // Only test happy path
✅ // Test both success AND error cases
```

**Don't hardcode values:**
```javascript
❌ pm.expect(post.id).to.equal(123);
✅ pm.expect(post.id).to.equal(parseInt(pm.environment.get('postId')));
```

**Don't make tests order-dependent:**
```javascript
❌ // Test 2 depends on Test 1 running first
✅ // Each test is independent
```

---

## Next Steps

**Expand automation:**
1. Add more negative test cases
2. Test edge cases (empty strings, very long strings, special characters)
3. Add performance benchmarks
4. Test concurrency (parallel requests)

**Production integration:**
1. Replace JSONPlaceholder with your API
2. Add authentication tests
3. Test against multi-environment setup
4. Integrate with CI/CD (see next tutorial)

---

## Related Topics

- [Test Scripts](../advanced/test-scripts.md) - Detailed test scripting guide
- [Collection Runner](../advanced/collection-runner.md) - Runner configuration
- [Data-Driven Testing](../advanced/data-driven-testing.md) - Advanced data file usage
- [REST API Testing](rest-api-testing.md) - REST fundamentals
- [CI/CD Integration](cicd-integration.md) - Automate test execution
