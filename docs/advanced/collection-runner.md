# Collection Runner

The Collection Runner lets you execute **multiple requests sequentially** with a single click. Perfect for testing complete workflows, running test suites, and validating API functionality end-to-end.

---

## Overview

**What is the Collection Runner?**

The Collection Runner executes all requests in a collection or folder in order, running their pre-request scripts and test scripts, and provides a comprehensive execution report.

**Use cases:**
- **Workflow testing**: Test complete user journeys (signup → login → create resource → delete)
- **Regression testing**: Verify all endpoints still work after changes
- **Test suites**: Run comprehensive API test collections
- **Data-driven testing**: Execute requests multiple times with different data
- **Smoke testing**: Quick health check of all critical endpoints

---

## How to Run a Collection

### Method 1: Run Entire Collection

![Collection Runner Button](../assets/screenshots/collection-runner-button.png)

1. Right-click on a collection in the sidebar
2. Select **"Run Collection"**
3. Configure run options (see below)
4. Click **"Run"** button
5. View results in real-time

### Method 2: Run Specific Folder

1. Right-click on a folder
2. Select **"Run Folder"**
3. Only requests in that folder (and subfolders) will execute

### Method 3: Run from Collection Menu

1. Click the **"▶ Run"** button next to collection name
2. Opens Collection Runner dialog
3. Configure and start execution

---

## Run Configuration Options

### Basic Options

![Collection Runner Settings](../assets/screenshots/collection-runner-settings.png)

#### **Environment**
- Select which environment variables to use
- `None` = No environment, use only collection/global variables
- Choose: `Development`, `Staging`, `Production`, etc.

#### **Iterations**
- Number of times to run the entire collection
- Default: `1` (run once)
- Use Case: Run same requests with different data (see Data-Driven Testing)

#### **Delay**
- Milliseconds to wait between requests
- Default: `0` (no delay)
- Use Case: Respect rate limits, simulate real user pacing
- Example: `1000` = 1 second delay between each request

#### **Stop on Error**
- If enabled, stops execution when first test fails or request errors
- If disabled, continues running remaining requests even if some fail
- Use Case: Enable for critical workflow tests, disable for comprehensive test runs

### Advanced Options

#### **Run Folder**
- Execute only requests in a specific folder
- Useful for running subset of collection (e.g., only admin tests)

#### **Data File** (See Data-Driven Testing section)
- Upload CSV or JSON file with test data
- Runs collection once per data row
- Overrides **Iterations** setting

---

## Reading the Run Results

### Results Dashboard

![Collection Runner Results](../assets/screenshots/collection-runner-results.png)

After running, you'll see:

#### **Summary Statistics**
```
✅ Passed:   15 / 20 requests
❌ Failed:   5 / 20 requests
⏱️ Total Time: 2.5 seconds
📊 Success Rate: 75%
```

#### **Request-by-Request Results**
Each request shows:
- ✅/❌ Status icon
- Request name
- HTTP method and URL
- Response status code (200, 404, etc.)
- Response time (ms)
- Test results (passed/failed count)

#### **Iteration Results** (if multiple iterations)
```
Iteration 1:  ✅ 18/20 passed
Iteration 2:  ✅ 17/20 passed
Iteration 3:  ❌ 12/20 passed
```

#### **Detailed Test Results**
Click on any request to see:
- Individual test assertions (pass/fail)
- Error messages for failed tests
- Console output (`console.log()` from scripts)
- Request headers, body
- Response headers, body

---

## Example: Basic Collection Run

### Collection Structure
```
📁 User API Tests
  ├── 📄 1. Create User (POST /users)
  ├── 📄 2. Get User (GET /users/{{user_id}})
  ├── 📄 3. Update User (PUT /users/{{user_id}})
  └── 📄 4. Delete User (DELETE /users/{{user_id}})
```

### Request Scripts

**Request 1: Create User - Test Script**
```javascript
pm.test("User created", function() {
  pm.response.to.have.status(201);
  const user = pm.response.json();
  
  // Save user ID for next requests
  pm.environment.set('user_id', user.id);
  console.log('✅ Created user:', user.id);
});
```

**Request 2: Get User - Test Script**
```javascript
pm.test("User retrieved", function() {
  pm.response.to.have.status(200);
  const user = pm.response.json();
  pm.expect(user.id).to.equal(parseInt(pm.environment.get('user_id')));
});
```

**Request 3: Update User - Test Script**
```javascript
pm.test("User updated", function() {
  pm.response.to.have.status(200);
  const user = pm.response.json();
  pm.expect(user.name).to.equal('Updated Name');
});
```

**Request 4: Delete User - Test Script**
```javascript
pm.test("User deleted", function() {
  pm.response.to.have.status(204);
});

// Cleanup
pm.environment.unset('user_id');
console.log('✅ User deleted, variables cleaned');
```

### Run Configuration
```
Environment: Development
Iterations: 1
Delay: 0ms
Stop on Error: ✅ Enabled
```

### Expected Results
```
✅ 1. Create User         201 Created    (250ms)  1/1 tests passed
✅ 2. Get User            200 OK         (120ms)  1/1 tests passed
✅ 3. Update User         200 OK         (180ms)  1/1 tests passed
✅ 4. Delete User         204 No Content (95ms)   1/1 tests passed

Summary: 4/4 passed ✅ | Total: 645ms
```

---

## Collection-Level Scripts

### Collection Pre-request Script

Runs **once before the entire collection** begins:

**Use Case: Authenticate once for all requests**

```javascript
// Collection Pre-request Script
console.log('=== Starting Collection Run ===');

// Check if we need to authenticate
const accessToken = pm.environment.get('access_token');

if (!accessToken) {
  console.log('⚠️ No access token found. Please run Login request first.');
  pm.environment.set('needs_auth', 'true');
} else {
  console.log('✅ Access token found');
}

// Set common headers for all requests
pm.request.headers.add({
  key: 'X-Collection-Run',
  value: 'true'
});
```

### Collection Test Script

Runs **after each request** in the collection:

**Use Case: Validate all responses have CORS headers**

```javascript
// Collection Test Script
pm.test("[Collection] CORS headers present", function() {
  pm.expect(pm.response.headers.get('Access-Control-Allow-Origin')).to.exist;
});

pm.test("[Collection] Response time acceptable", function() {
  pm.expect(pm.response.responseTime).to.be.below(3000);
});

// Log each request
console.log(`✅ Completed: ${pm.info.requestName} - ${pm.response.code}`);
```

---

## Handling Dependencies Between Requests

### Pattern 1: Chain with Variables

**Request 1: Create Order**
```javascript
// Test script
pm.test("Order created", function() {
  const order = pm.response.json();
  pm.environment.set('order_id', order.id);
  pm.environment.set('order_total', order.total);
});
```

**Request 2: Process Payment**
```
URL: POST /payments
Body:
{
  "orderId": "{{order_id}}",
  "amount": {{order_total}}
}
```

**Request 3: Confirm Order**
```
URL: POST /orders/{{order_id}}/confirm
```

### Pattern 2: Conditional Execution

**Pre-request Script:**
```javascript
// Skip this request if previous request failed
const orderCreated = pm.environment.get('order_created');

if (!orderCreated || orderCreated !== 'true') {
  console.log('⚠️ Skipping: Order was not created');
  // In Collection Runner, this request will still execute
  // but you can check this condition in test script
}
```

**Test Script:**
```javascript
const orderCreated = pm.environment.get('order_created');

if (!orderCreated || orderCreated !== 'true') {
  pm.test("Skipped: No order to confirm", function() {
    pm.expect(true).to.be.true; // Auto-pass
  });
  return; // Exit early
}

// Normal validation if order exists
pm.test("Order confirmed", function() {
  pm.response.to.have.status(200);
});
```

### Pattern 3: Aggregate Results

**Collection Pre-request:**
```javascript
// Initialize counters
pm.environment.set('total_requests', '0');
pm.environment.set('successful_requests', '0');
```

**Collection Test:**
```javascript
// Update counters after each request
let total = parseInt(pm.environment.get('total_requests')) || 0;
let successful = parseInt(pm.environment.get('successful_requests')) || 0;

total++;
if (pm.response.code >= 200 && pm.response.code < 300) {
  successful++;
}

pm.environment.set('total_requests', total.toString());
pm.environment.set('successful_requests', successful.toString());

// Log progress
console.log(`Progress: ${successful}/${total} successful`);
```

---

## Multiple Iterations

**Use Case:** Test stability by running same workflow multiple times

### Configuration
```
Iterations: 5
Delay: 1000ms (1 second)
```

### Result Display
```
Iteration 1: ✅ 4/4 passed (650ms)
Iteration 2: ✅ 4/4 passed (620ms)
Iteration 3: ✅ 4/4 passed (680ms)
Iteration 4: ✅ 4/4 passed (595ms)
Iteration 5: ✅ 4/4 passed (710ms)

Total: 20/20 passed ✅
Average time per iteration: 651ms
```

### Use Case: Generate Unique Data Per Iteration

**Pre-request Script:**
```javascript
const iteration = pm.info.iteration; // Current iteration number (0-based)
const username = `user_${iteration}_${Date.now()}`;
const email = `user${iteration}@test.com`;

pm.environment.set('test_username', username);
pm.environment.set('test_email', email);

console.log(`Iteration ${iteration + 1}: ${username}`);
```

---

## Organizing Test Collections

### Strategy 1: Separate by Functionality

```
📁 User Management
  ├── Create User
  ├── Get User
  ├── Update User
  └── Delete User

📁 Order Management
  ├── Create Order
  ├── Add Items
  ├── Process Payment
  └── Complete Order

📁 Authentication
  ├── Login
  ├── Refresh Token
  └── Logout
```

**Run each folder independently:**
- Right-click "User Management" → Run Folder
- Right-click "Order Management" → Run Folder

### Strategy 2: Smoke Tests vs. Comprehensive Tests

```
📁 API Test Suite
  📁 Smoke Tests (Quick health check)
    ├── Health Endpoint
    ├── Login
    └── Get User Profile
  
  📁 Comprehensive Tests (Full validation)
    ├── All CRUD operations
    ├── Edge cases
    └── Error scenarios
```

**Quick smoke test:** Run "Smoke Tests" folder (3 requests, ~1 second)  
**Full test run:** Run entire collection (30+ requests, ~10 seconds)

### Strategy 3: Environment-Specific Tests

**Collection Variables:**
```
test_environment: "dev|staging|prod"
```

**Pre-request Script:**
```javascript
const env = pm.environment.name;

if (env === 'Production') {
  // Production: Only read operations
  console.log('🔒 Production mode: Skipping destructive tests');
  pm.environment.set('skip_delete_tests', 'true');
} else {
  // Dev/Staging: All operations allowed
  pm.environment.unset('skip_delete_tests');
}
```

**Delete Request Pre-request:**
```javascript
if (pm.environment.get('skip_delete_tests') === 'true') {
  console.log('⚠️ Skipping delete in production');
  // Request will still execute, handle in test script
}
```

---

## Best Practices

### ✅ DO:
- **Order requests logically**: Create → Read → Update → Delete
- **Use descriptive names**: "1. Create User" vs "Request1"
- **Clean up after yourself**: Delete test data, unset variables
- **Add delays for rate limits**: Prevent 429 Too Many Requests errors
- **Use collection/folder scripts**: DRY (Don't Repeat Yourself)
- **Log important milestones**: `console.log()` for debugging
- **Test independently**: Each request should validate its own response

### ❌ DON'T:
- **Don't rely on request order**: A request might fail, breaking the chain
- **Don't hardcode IDs**: Use variables to chain requests
- **Don't skip error handling**: Check if previous data exists before using
- **Don't run destructive tests in prod**: Use environment checks
- **Don't ignore delays**: Rapid requests can trigger rate limiting
- **Don't create orphaned data**: Always clean up test resources

---

## Troubleshooting

### Issue: Requests Fail in Collection Run but Work Individually

**Cause:** Variable not set by previous request

**Solution:**
```javascript
// Pre-request: Check if dependency exists
const userId = pm.environment.get('user_id');
if (!userId) {
  console.error('❌ user_id not found. Run "Create User" first.');
}

// Test: Validate both status and dependency
pm.test("User ID exists", function() {
  const userId = pm.environment.get('user_id');
  pm.expect(userId).to.not.be.undefined;
});
```

### Issue: Tests Pass Individually but Fail in Collection Run

**Cause:** Variable pollution from previous runs

**Solution:**
```javascript
// Collection Pre-request: Clean slate
pm.environment.unset('user_id');
pm.environment.unset('order_id');
pm.environment.unset('token');

console.log('🧹 Cleaned environment variables');
```

### Issue: Different Results on Each Iteration

**Cause:** Timing issues, race conditions, or data conflicts

**Solution:**
- Add delays between requests
- Use unique data per iteration
- Check server-side rate limiting

```javascript
// Pre-request: Unique data per iteration
const timestamp = Date.now();
const iteration = pm.info.iteration || 0;
const uniqueId = `${iteration}_${timestamp}`;

pm.environment.set('unique_id', uniqueId);
```

### Issue: Collection Runs Too Slow

**Optimization:**
- Remove unnecessary delays
- Run only on changed endpoints (use folders)
- Optimize slow requests
- Consider parallel execution (not supported in Simba currently)

---

## Example: Complete E-commerce Workflow

```
📁 E-commerce Checkout Flow
  ├── 1. Register User
  ├── 2. Login
  ├── 3. Browse Products
  ├── 4. Add to Cart
  ├── 5. Apply Discount Code
  ├── 6. Create Order
  ├── 7. Process Payment
  ├── 8. Confirm Order
  └── 9. Get Order Status
```

**Expected Flow:**
```
1. Register → Save user_id
2. Login → Save access_token
3. Browse Products → Save product_ids
4. Add to Cart → Use product_id, save cart_id
5. Apply Discount → Use cart_id
6. Create Order → Use cart_id, save order_id
7. Process Payment → Use order_id
8. Confirm Order → Use order_id
9. Get Status → Use order_id, validate completion
```

**Run Configuration:**
```
Environment: Staging
Iterations: 1
Delay: 500ms
Stop on Error: ✅
```

**Expected Results:**
```
✅ All 9 requests passed
⏱️ Total time: 4.5 seconds
🛒 Complete checkout workflow validated
```

---

## Related Topics

- [Pre-request Scripts](pre-request-scripts.md) - Prepare data for collection runs
- [Test Scripts](test-scripts.md) - Validate responses in collection runs
- [Data-Driven Testing](data-driven-testing.md) - Run collections with CSV/JSON data
- [Environments](../core-concepts/environments.md) - Switch contexts for collections
- [Automated Testing Tutorial](../tutorials/automated-testing.md) - Build comprehensive test suites
- [CI/CD Integration](../tutorials/cicd-integration.md) - Automate collection runs in pipelines
