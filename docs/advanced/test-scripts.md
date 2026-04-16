# Test Scripts

Test scripts are JavaScript code that runs **after** your request completes. Use them to validate responses, extract data, and verify API behavior.

---

## Overview

Test scripts enable you to:
- **Validate responses**: Check status codes, headers, body content
- **Extract data**: Save response values to variables for later use
- **Chain requests**: Pass data from one request to the next
- **Automate testing**: Write comprehensive API test suites
- **Assert behavior**: Verify API contracts and business logic

**Execution Order:**
```
1. Request is sent
2. Response received
   ↓
3. Request test script
4. Folder test script (if exists)
5. Collection test script (if exists)
```

---

## Where to Add Test Scripts

### 1. Request Level (Most Common)

![Test Script Tab](../assets/screenshots/request-testscript-tab.png)

1. Open your request
2. Go to the **Test** tab  (or **Tests** tab)
3. Write JavaScript test code
4. Send request and view results in **Test Results** panel

**Use case:** Request-specific validations (verify user was created successfully)

### 2. Collection Level

1. Right-click collection → **Edit Collection**
2. Go to **Test Scripts** tab
3. Runs after **every request** in the collection

**Use case:** Collection-wide validations (every response should have CORS headers)

### 3. Folder Level

1. Right-click folder → **Edit Folder**
2. Go to **Test Scripts** tab
3. Runs after every request in this folder and subfolders

**Use case:** Section-specific validations (all admin endpoints require admin role)

---

## Writing Tests

### Basic Test Structure

```javascript
pm.test("Test name appears in UI", function() {
  // Assertions go here
  pm.expect(true).to.be.true;
});
```

### Example: Status Code Check

```javascript
pm.test("Status code is 200", function() {
  pm.response.to.have.status(200);
});
```

### Example: Response Body Validation

```javascript
pm.test("Response contains user email", function() {
  const response = pm.response.json();
  pm.expect(response).to.have.property('email');
  pm.expect(response.email).to.be.a('string');
});
```

---

## Available APIs

Test scripts have access to the `pm` object with response data:

### Response Access
```javascript
pm.response.code              // Status code (e.g., 200)
pm.response.status            // Status text (e.g., "OK")
pm.response.headers           // Response headers
pm.response.responseTime      // Response time in ms
pm.response.responseSize      // Response size in bytes

pm.response.text()            // Response body as string
pm.response.json()            // Response body as JSON object
```

### Test Framework
```javascript
pm.test(name, function)       // Define a test
pm.expect(value)              // Chai expect assertions
```

### Variable Management (Same as Pre-request)
```javascript
pm.environment.get(key)
pm.environment.set(key, value)
pm.collectionVariables.get(key)
pm.collectionVariables.set(key, value)
pm.globals.get(key)
pm.globals.set(key, value)
pm.variables.get(key)
```

**📖 Full API Reference**: See [Scripting API Reference](../reference/scripting-api.md)

---

## Common Validations

### 1. Status Code Assertions

```javascript
// Single status code
pm.test("Status code is 200", function() {
  pm.response.to.have.status(200);
});

// Multiple acceptable status codes
pm.test("Status code is 200 or 201", function() {
  pm.expect([200, 201]).to.include(pm.response.code);
});

// Status code ranges
pm.test("Status code is success (2xx)", function() {
  pm.expect(pm.response.code).to.be.within(200, 299);
});

// Common status codes
pm.test("Resource created", function() {
  pm.response.to.have.status(201);
});

pm.test("Bad request", function() {
  pm.response.to.have.status(400);
});

pm.test("Unauthorized", function() {
  pm.response.to.have.status(401);
});

pm.test("Not found", function() {
  pm.response.to.have.status(404);
});
```

### 2. Response Time Validation

```javascript
pm.test("Response time is less than 500ms", function() {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response time is acceptable", function() {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Log response time
console.log(`⏱️ Response time: ${pm.response.responseTime}ms`);
```

### 3. Header Validation

```javascript
// Check header exists
pm.test("Content-Type header is present", function() {
  pm.response.to.have.header("Content-Type");
});

// Check header value
pm.test("Content-Type is JSON", function() {
  pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// Multiple headers
pm.test("CORS headers present", function() {
  pm.response.to.have.header("Access-Control-Allow-Origin");
  pm.response.to.have.header("Access-Control-Allow-Methods");
});

// Custom header validation
pm.test("Rate limit headers exist", function() {
  pm.expect(pm.response.headers.get("X-RateLimit-Limit")).to.exist;
  pm.expect(pm.response.headers.get("X-RateLimit-Remaining")).to.exist;
});
```

### 4. JSON Response Validation

```javascript
// Basic structure
pm.test("Response is valid JSON", function() {
  pm.response.to.be.json;
});

// Property exists
pm.test("Response has userId property", function() {
  const response = pm.response.json();
  pm.expect(response).to.have.property('userId');
});

// Property type
pm.test("userId is a number", function() {
  const response = pm.response.json();
  pm.expect(response.userId).to.be.a('number');
});

// Property value
pm.test("User email is correct", function() {
  const response = pm.response.json();
  pm.expect(response.email).to.equal('user@example.com');
});

// Nested properties
pm.test("Address has city", function() {
  const response = pm.response.json();
  pm.expect(response.address).to.have.property('city');
  pm.expect(response.address.city).to.be.a('string');
});

// Array validation
pm.test("Response is an array", function() {
  const response = pm.response.json();
  pm.expect(response).to.be.an('array');
});

pm.test("Array is not empty", function() {
  const response = pm.response.json();
  pm.expect(response.length).to.be.above(0);
});

pm.test("Array has exactly 5 items", function() {
  const response = pm.response.json();
  pm.expect(response).to.have.lengthOf(5);
});

// Array item validation
pm.test("All items have id property", function() {
  const response = pm.response.json();
  response.forEach(item => {
    pm.expect(item).to.have.property('id');
  });
});
```

### 5. String Validation

```javascript
pm.test("Response message contains 'success'", function() {
  const response = pm.response.json();
  pm.expect(response.message).to.include('success');
});

pm.test("Email format is valid", function() {
  const response = pm.response.json();
  pm.expect(response.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});

pm.test("URL is valid", function() {
  const response = pm.response.json();
  pm.expect(response.url).to.match(/^https?:\/\/.+/);
});

pm.test("UUID format is valid", function() {
  const response = pm.response.json();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  pm.expect(response.id).to.match(uuidRegex);
});
```

### 6. Number Validation

```javascript
pm.test("Age is valid", function() {
  const response = pm.response.json();
  pm.expect(response.age).to.be.a('number');
  pm.expect(response.age).to.be.above(0);
  pm.expect(response.age).to.be.below(150);
});

pm.test("Price is in valid range", function() {
  const response = pm.response.json();
  pm.expect(response.price).to.be.within(0, 1000000);
});

pm.test("Percentage is correct", function() {
  const response = pm.response.json();
  pm.expect(response.completionPercentage).to.be.within(0, 100);
});
```

### 7. Boolean Validation

```javascript
pm.test("User is active", function() {
  const response = pm.response.json();
  pm.expect(response.isActive).to.be.true;
});

pm.test("Email is verified", function() {
  const response = pm.response.json();
  pm.expect(response.emailVerified).to.equal(true);
});
```

### 8. Date Validation

```javascript
pm.test("Created date is valid ISO 8601", function() {
  const response = pm.response.json();
  const date = new Date(response.createdAt);
  pm.expect(date.toString()).to.not.equal('Invalid Date');
});

pm.test("Created date is recent", function() {
  const response = pm.response.json();
  const createdAt = new Date(response.createdAt);
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  pm.expect(createdAt.getTime()).to.be.above(fiveMinutesAgo.getTime());
});
```

---

## Data Extraction & Chaining

### Extract Data from Response

```javascript
// Save single value
pm.test("Save user ID for next request", function() {
  const response = pm.response.json();
  pm.environment.set('user_id', response.id);
  console.log('Saved user_id:', response.id);
});

// Save multiple values
pm.test("Save user data", function() {
  const response = pm.response.json();
  pm.environment.set('user_id', response.id);
  pm.environment.set('user_email', response.email);
  pm.environment.set('user_name', response.name);
});

// Save nested value
pm.test("Save address city", function() {
  const response = pm.response.json();
  pm.environment.set('user_city', response.address.city);
});

// Save array item
pm.test("Save first item ID", function() {
  const response = pm.response.json();
  if (response.length > 0) {
    pm.environment.set('first_item_id', response[0].id);
  }
});
```

### Chain Requests Example

**Request 1: Create User (POST /users)**

**Test Script:**
```javascript
pm.test("User created successfully", function() {
  pm.response.to.have.status(201);
  const response = pm.response.json();
  
  // Save user ID for subsequent requests
  pm.environment.set('created_user_id', response.id);
  pm.environment.set('created_user_email', response.email);
  
  console.log(`✅ Created user ID: ${response.id}`);
});
```

**Request 2: Get User (GET /users/{{created_user_id}})**

**Test Script:**
```javascript
pm.test("User retrieved successfully", function() {
  pm.response.to.have.status(200);
  const response = pm.response.json();
  
  // Verify it's the same user we created
  const expectedId = pm.environment.get('created_user_id');
  pm.expect(response.id).to.equal(expectedId);
  
  const expectedEmail = pm.environment.get('created_user_email');
  pm.expect(response.email).to.equal(expectedEmail);
});
```

**Request 3: Update User (PUT /users/{{created_user_id}})**

**Test Script:**
```javascript
pm.test("User updated successfully", function() {
  pm.response.to.have.status(200);
  const response = pm.response.json();
  
  // Verify update
  pm.expect(response.name).to.equal('Updated Name');
});
```

**Request 4: Delete User (DELETE /users/{{created_user_id}})**

**Test Script:**
```javascript
pm.test("User deleted successfully", function() {
  pm.response.to.have.status(204);
});

// Clean up environment variables
pm.environment.unset('created_user_id');
pm.environment.unset('created_user_email');
console.log('✅ Cleaned up user data');
```

---

## Advanced Test Patterns

### Pattern 1: Conditional Tests

```javascript
// Test only if status is 200
if (pm.response.code === 200) {
  pm.test("Response body is valid", function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('data');
  });
}

// Different tests for different statuses
if (pm.response.code === 201) {
  pm.test("Resource created with ID", function() {
    const response = pm.response.json();
    pm.expect(response.id).to.exist;
  });
} else if (pm.response.code === 400) {
  pm.test("Error message provided", function() {
    const response = pm.response.json();
    pm.expect(response.error).to.exist;
  });
}
```

### Pattern 2: Schema Validation

```javascript
pm.test("Response matches expected schema", function() {
  const response = pm.response.json();
  
  // Define expected schema
  const schema = {
    id: 'number',
    name: 'string',
    email: 'string',
    age: 'number',
    isActive: 'boolean',
    address: {
      street: 'string',
      city: 'string',
      zipCode: 'string'
    },
    roles: 'array'
  };
  
  // Validate structure
  pm.expect(response).to.be.an('object');
  pm.expect(response.id).to.be.a('number');
  pm.expect(response.name).to.be.a('string');
  pm.expect(response.email).to.be.a('string');
  pm.expect(response.age).to.be.a('number');
  pm.expect(response.isActive).to.be.a('boolean');
  pm.expect(response.address).to.be.an('object');
  pm.expect(response.address.street).to.be.a('string');
  pm.expect(response.address.city).to.be.a('string');
  pm.expect(response.address.zipCode).to.be.a('string');
  pm.expect(response.roles).to.be.an('array');
});
```

### Pattern 3: Response Comparison

```javascript
// Compare with expected value from environment
pm.test("Response matches expected", function() {
  const response = pm.response.json();
  const expected = JSON.parse(pm.environment.get('expected_response'));
  
  pm.expect(response.id).to.equal(expected.id);
  pm.expect(response.name).to.equal(expected.name);
});

// Compare with previous response
pm.test("Data hasn't changed since last request", function() {
  const response = pm.response.json();
  const previous = JSON.parse(pm.environment.get('previous_response') || 'null');
  
  if (previous) {
    pm.expect(response.id).to.equal(previous.id);
    pm.expect(response.updatedAt).to.equal(previous.updatedAt);
  }
  
  // Save current for next comparison
  pm.environment.set('previous_response', JSON.stringify(response));
});
```

### Pattern 4: Aggregate Test Results

```javascript
// Collection-level test to track overall results
const totalTests = pm.environment.get('total_tests') || 0;
const passedTests = pm.environment.get('passed_tests') || 0;
const failedTests = pm.environment.get('failed_tests') || 0;

// Update counts (simplified - actual implementation more complex)
pm.environment.set('total_tests', parseInt(totalTests) + 1);

if (pm.response.code === 200) {
  pm.environment.set('passed_tests', parseInt(passedTests) + 1);
} else {
  pm.environment.set('failed_tests', parseInt(failedTests) + 1);
}

console.log(`Tests: ${passedTests}/${totalTests} passed`);
```

---

## Real-World Examples

### Example 1: GitHub API User Validation

```javascript
pm.test("GitHub user response is valid", function() {
  pm.response.to.have.status(200);
  
  const user = pm.response.json();
  
  // Required fields
  pm.expect(user).to.have.property('login');
  pm.expect(user).to.have.property('id');
  pm.expect(user).to.have.property('avatar_url');
  pm.expect(user).to.have.property('url');
  
  // Types
  pm.expect(user.login).to.be.a('string');
  pm.expect(user.id).to.be.a('number');
  pm.expect(user.public_repos).to.be.a('number');
  
  // URL validation
  pm.expect(user.avatar_url).to.match(/^https:\/\//);
  pm.expect(user.url).to.match(/^https:\/\/api\.github\.com/);
  
  // Business logic
  pm.expect(user.public_repos).to.be.at.least(0);
  pm.expect(user.followers).to.be.at.least(0);
  
  console.log(`✅ Validated user: ${user.login}`);
});

pm.test("Rate limit headers present", function() {
  pm.expect(pm.response.headers.get('X-RateLimit-Limit')).to.exist;
  pm.expect(pm.response.headers.get('X-RateLimit-Remaining')).to.exist;
  
  const remaining = parseInt(pm.response.headers.get('X-RateLimit-Remaining'));
  console.log(`GitHub API: ${remaining} requests remaining`);
});
```

### Example 2: JSONPlaceholder Posts

```javascript
pm.test("Posts list retrieved", function() {
  pm.response.to.have.status(200);
  
  const posts = pm.response.json();
  
  // Array validation
  pm.expect(posts).to.be.an('array');
  pm.expect(posts.length).to.be.above(0);
  
  // Check first post structure
  const firstPost = posts[0];
  pm.expect(firstPost).to.have.all.keys('userId', 'id', 'title', 'body');
  
  // Validate all posts
  posts.forEach((post, index) => {
    pm.expect(post.userId, `Post ${index} userId`).to.be.a('number');
    pm.expect(post.id, `Post ${index} id`).to.be.a('number');
    pm.expect(post.title, `Post ${index} title`).to.be.a('string').and.not.empty;
    pm.expect(post.body, `Post ${index} body`).to.be.a('string').and.not.empty;
  });
  
  console.log(`✅ Validated ${posts.length} posts`);
});

// Save random post for next request
pm.test("Save random post ID", function() {
  const posts = pm.response.json();
  const randomPost = posts[Math.floor(Math.random() * posts.length)];
  pm.environment.set('random_post_id', randomPost.id);
  console.log(`Saved random post ID: ${randomPost.id}`);
});
```

### Example 3: Authentication Flow

**Login Request Test:**
```javascript
pm.test("Login successful", function() {
  pm.response.to.have.status(200);
  
  const response = pm.response.json();
  
  // Validate token structure
  pm.expect(response).to.have.property('accessToken');
  pm.expect(response).to.have.property('refreshToken');
  pm.expect(response).to.have.property('expiresIn');
  
  // Save tokens
  pm.environment.set('access_token', response.accessToken);
  pm.environment.set('refresh_token', response.refreshToken);
  
  // Calculate expiration
  const expiresIn = response.expiresIn; // seconds
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  pm.environment.set('token_expires_at', expiresAt.toISOString());
  
  console.log(`✅ Logged in. Token expires at ${expiresAt.toLocaleString()}`);
});

pm.test("Token is valid JWT", function() {
  const response = pm.response.json();
  const token = response.accessToken;
  
  // Basic JWT structure check (header.payload.signature)
  const parts = token.split('.');
  pm.expect(parts).to.have.lengthOf(3);
  
  console.log('Token format valid');
});
```

---

## Debugging Test Scripts

### Console Logging

```javascript
// Log response data
console.log('Status:', pm.response.code);
console.log('Headers:', pm.response.headers.toObject());
console.log('Body:', pm.response.text());
console.log('JSON:', pm.response.json());

// Log specific values
const response = pm.response.json();
console.log('User ID:', response.id);
console.log('Full response:', JSON.stringify(response, null, 2));
```

### View Test Results

![Test Results Panel](../assets/screenshots/test-results-panel.png)

After sending a request:
1. Check **Test Results** tab
2. ✅ Green = Passed
3. ❌ Red = Failed (shows error message)
4. View **Console** tab for `console.log()` output

 Troubleshooting Failed Tests

```javascript
try {
  const response = pm.response.json();
  pm.test("Response is valid", function() {
    pm.expect(response.id).to.exist;
  });
} catch (error) {
  console.error('Test failed:', error.message);
  console.log('Response text:', pm.response.text());
}
```

---

## Best Practices

### ✅ DO:
- **Write descriptive test names**: "User email is valid format" vs "Test 1"
- **Test one thing per test**: Easier to debug when tests fail
- **Use meaningful assertions**: `pm.expect(user.age).to.be.above(0)` vs `pm.expect(user.age > 0).to.be.true`
- **Log important values**: Use `console.log()` for debugging
- **Save data for chaining**: Extract IDs, tokens for subsequent requests
- **Handle errors gracefully**: Wrap risky operations in try-catch
- **Keep tests readable**: Comment complex logic

### ❌ DON'T:
- **Don't test everything**: Focus on critical paths and business logic
- **Don't hardcode values**: Use environment variables for flexibility
- **Don't ignore edge cases**: Test null, empty arrays, error responses
- **Don't write flaky tests**: Avoid time-dependent logic
- **Don't make tests depend on order**: Each test should be independent
- **Don't overcomplicate**: Simple assertions are better than complex logic

---

## Related Topics

- [Pre-request Scripts](pre-request-scripts.md) - Prepare data before requests
- [Scripting API Reference](../reference/scripting-api.md) - Complete API docs  
- [Collection Runner](collection-runner.md) - Run and verify multiple requests
- [Automated Testing Tutorial](../tutorials/automated-testing.md) - Build comprehensive test suites
- [Variables](../core-concepts/variables.md) - Store and reuse test data
