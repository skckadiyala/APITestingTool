# Data-Driven Testing

Data-driven testing lets you run the same collection multiple times with **different input data** from CSV or JSON files. Perfect for testing with various datasets, user scenarios, and edge cases.

---

## Overview

**What is Data-Driven Testing?**

Instead of manually running requests with different data, you:
1. Upload a CSV or JSON file with test data
2. Run your collection once
3. Simba executes the collection once per data row
4. Each iteration uses different values from your data file

**Use cases:**
- **Multiple user scenarios**: Test with different user types, roles, permissions
- **Boundary testing**: Min/max values, edge cases, invalid data
- **Regression testing**: Same API, many input combinations
- **Bulk testing**: Create multiple resources efficiently
- **Localization testing**: Test different languages, regions, currencies

---

## How It Works

### Execution Flow

```
1. Upload data file (5 rows) → Collection runner
   ↓
2. Iteration 1: Use row 1 data
   - Run all requests with row 1 values
   - Execute pre-request and test scripts
   ↓
3. Iteration 2: Use row 2 data
   - Run all requests with row 2 values
   ↓
... continues for all 5 rows ...
   ↓
5. Result: 5 complete execution reports
```

### Data Accessibility

Data from the current row is available in scripts via:
```javascript
pm.iterationData.get('column_name')
```

---

## Supported File Formats

### CSV (Comma-Separated Values)

**Example: users.csv**
```csv
username,email,age,role
john_doe,john@example.com,25,user
jane_admin,jane@example.com,30,admin
test_user,test@example.com,18,user
senior_user,senior@example.com,65,user
```

**Characteristics:**
- ✅ Simple format, easy to create in Excel/Google Sheets
- ✅ Lightweight, good for large datasets
- ✅ One row = one iteration
- ❌ Limited to flat data (no nested objects/arrays)

### JSON (JavaScript Object Notation)

**Example: users.json**
```json
[
  {
    "username": "john_doe",
    "email": "john@example.com",
    "age": 25,
    "role": "user",
    "address": {
      "city": "New York",
      "zipCode": "10001"
    }
  },
  {
    "username": "jane_admin",
    "email": "jane@example.com",
    "age": 30,
    "role": "admin",
    "address": {
      "city": "Los Angeles",
      "zipCode": "90001"
    }
  }
]
```

**Characteristics:**
- ✅ Supports nested objects and arrays
- ✅ More flexible than CSV
- ✅ Easy to generate programmatically
- ❌ Slightly larger file size

---

## Using Data Files in Collection Runner

### Step 1: Prepare Your Data File

**Create CSV in Excel/Google Sheets:**
1. Add column headers in first row
2. Add data rows below
3. Export as CSV

**Create JSON:**
1. Create array of objects
2. Each object = one iteration
3. Save as `.json` file

### Step 2: Upload to Simba

![Upload Data File](../assets/screenshots/data-file-upload.png)

1. Go to **Workspace Settings** → **Data Files**
2. Click **"Upload Data File"**
3. Select your CSV or JSON file
4. File is uploaded and parsed
5. Preview shows first few rows

### Step 3: Run Collection with Data File

![Collection Runner with Data](../assets/screenshots/collection-runner-data.png)

1. Right-click collection → **"Run Collection"**
2. In Collection Runner dialog:
   - Select **Data File** from dropdown
   - Choose your uploaded data file
3. Click **"Run"**
4. Collection runs once per data row

### Step 4: View Results

![Data-Driven Results](../assets/screenshots/data-driven-results.png)

```
Iteration 1 (john_doe):     ✅ 3/3 passed
Iteration 2 (jane_admin):   ✅ 3/3 passed
Iteration 3 (test_user):    ✅ 3/3 passed
Iteration 4 (senior_user):  ❌ 2/3 passed

Summary: 11/12 tests passed (91.7%)
```

---

## Accessing Data in Scripts

### Using CSV Data

**Data file: users.csv**
```csv
username,email,age,role
john_doe,john@example.com,25,user
```

**Pre-request Script:**
```javascript
// Get values from current iteration
const username = pm.iterationData.get('username');
const email = pm.iterationData.get('email');
const age = pm.iterationData.get('age');
const role = pm.iterationData.get('role');

// Save to environment for use in request
pm.environment.set('test_username', username);
pm.environment.set('test_email', email);
pm.environment.set('test_age', age);
pm.environment.set('test_role', role);

console.log(`Testing user: ${username} (${role})`);
```

**Request Body:**
```json
{
  "username": "{{test_username}}",
  "email": "{{test_email}}",
  "age": {{test_age}},
  "role": "{{test_role}}"
}
```

**Test Script:**
```javascript
pm.test("User created successfully", function() {
  pm.response.to.have.status(201);
  
  const response = pm.response.json();
  const expectedUsername = pm.iterationData.get('username');
  pm.expect(response.username).to.equal(expectedUsername);
  
  console.log(`✅ Created user: ${response.username}`);
});
```

### Using JSON Data (Nested Objects)

**Data file: users.json**
```json
[
  {
    "user": {
      "username": "john_doe",
      "email": "john@example.com"
    },
    "address": {
      "city": "New York",
      "zipCode": "10001"
    }
  }
]
```

**Pre-request Script:**
```javascript
// Access nested data
const userData = pm.iterationData.get('user');
const addressData = pm.iterationData.get('address');

pm.environment.set('test_username', userData.username);
pm.environment.set('test_email', userData.email);
pm.environment.set('test_city', addressData.city);
pm.environment.set('test_zipcode', addressData.zipCode);

console.log(`Testing user in ${addressData.city}`);
```

---

## Real-World Examples

### Example 1: Create Multiple Users

**Data file: new_users.csv**
```csv
firstName,lastName,email,age,department
John,Doe,john.doe@company.com,28,Engineering
Jane,Smith,jane.smith@company.com,32,Marketing
Bob,Johnson,bob.johnson@company.com,45,Sales
Alice,Williams,alice.williams@company.com,26,Engineering
```

**Collection: User Management**
```
📁 User Management
  └── Create User (POST /users)
```

**Create User - Pre-request Script:**
```javascript
// Generate timestamp for uniqueness
const timestamp = Date.now();

// Get data from current row
const firstName = pm.iterationData.get('firstName');
const lastName = pm.iterationData.get('lastName');
const email = pm.iterationData.get('email');
const age = parseInt(pm.iterationData.get('age'));
const department = pm.iterationData.get('department');

// Create unique username
const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}`;

// Store for request
pm.environment.set('user_data', JSON.stringify({
  username: username,
  firstName: firstName,
  lastName: lastName,
  email: email,
  age: age,
  department: department
}));

console.log(`Creating user: ${firstName} ${lastName} (${department})`);
```

**Create User - Request Body:**
```json
{{{user_data}}}
```

**Create User - Test Script:**
```javascript
const expectedFirstName = pm.iterationData.get('firstName');
const expectedLastName = pm.iterationData.get('lastName');
const expectedDepartment = pm.iterationData.get('department');

pm.test(`${expectedFirstName} ${expectedLastName} created`, function() {
  pm.response.to.have.status(201);
  const user = pm.response.json();
  
  pm.expect(user.firstName).to.equal(expectedFirstName);
  pm.expect(user.lastName).to.equal(expectedLastName);
  pm.expect(user.department).to.equal(expectedDepartment);
});

pm.test("User ID assigned", function() {
  const user = pm.response.json();
  pm.expect(user.id).to.exist;
});
```

**Run Results:**
```
Iteration 1 (John Doe):        ✅ 2/2 tests passed
Iteration 2 (Jane Smith):      ✅ 2/2 tests passed
Iteration 3 (Bob Johnson):     ✅ 2/2 tests passed
Iteration 4 (Alice Williams):  ✅ 2/2 tests passed

Summary: 8/8 tests passed ✅
Created 4 users successfully
```

### Example 2: Login with Different Credentials

**Data file: login_tests.csv**
```csv
username,password,expectedStatus,testDescription
admin,Admin@123,200,Valid admin login
user,User@123,200,Valid user login
guest,Guest@123,403,Guest forbidden
hacker,wrong,401,Invalid credentials
admin,,400,Missing password
,Admin@123,400,Missing username
```

**Collection: Authentication Tests**
```
📁 Authentication Tests
  └── Login (POST /auth/login)
```

**Login - Pre-request Script:**
```javascript
const username = pm.iterationData.get('username');
const password = pm.iterationData.get('password');
const testDescription = pm.iterationData.get('testDescription');

pm.environment.set('login_username', username || '');
pm.environment.set('login_password', password || '');

console.log(`Test: ${testDescription}`);
```

**Login - Request Body:**
```json
{
  "username": "{{login_username}}",
  "password": "{{login_password}}"
}
```

**Login - Test Script:**
```javascript
const expectedStatus = parseInt(pm.iterationData.get('expectedStatus'));
const testDescription = pm.iterationData.get('testDescription');

pm.test(`[${testDescription}] Status code is ${expectedStatus}`, function() {
  pm.expect(pm.response.code).to.equal(expectedStatus);
});

// Additional validations for successful login
if (expectedStatus === 200) {
  pm.test(`[${testDescription}] Access token provided`, function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('accessToken');
  });
}

// Validate error message for failures
if (expectedStatus >= 400) {
  pm.test(`[${testDescription}] Error message provided`, function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('error');
  });
}
```

**Run Results:**
```
Iteration 1 (Valid admin login):     ✅ 2/2 passed
Iteration 2 (Valid user login):      ✅ 2/2 passed
Iteration 3 (Guest forbidden):       ✅ 2/2 passed
Iteration 4 (Invalid credentials):   ✅ 2/2 passed
Iteration 5 (Missing password):      ✅ 2/2 passed
Iteration 6 (Missing username):      ✅ 2/2 passed

Summary: 12/12 tests passed ✅
All authentication scenarios validated
```

### Example 3: Boundary Value Testing

**Data file: age_validation.csv**
```csv
age,shouldPass,testCase
0,false,Zero age
1,true,Minimum valid age
17,false,Below adult age
18,true,Exactly adult age
65,true,Normal adult age
120,true,Maximum reasonable age
121,false,Above maximum age
-1,false,Negative age
abc,false,Non-numeric age
,false,Missing age
```

**Create User - Test Script:**
```javascript
const testAge = pm.iterationData.get('age');
const shouldPass = pm.iterationData.get('shouldPass') === 'true';
const testCase = pm.iterationData.get('testCase');

if (shouldPass) {
  pm.test(`[${testCase}] Valid age accepted`, function() {
    pm.expect(pm.response.code).to.be.within(200, 299);
  });
} else {
  pm.test(`[${testCase}] Invalid age rejected`, function() {
    pm.expect(pm.response.code).to.equal(400);
    const response = pm.response.json();
    pm.expect(response.error).to.include('age');
  });
}
```

---

## Advanced Patterns

### Pattern 1: Dependent Requests with Data

**Data file: orders.json**
```json
[
  {
    "productId": 101,
    "quantity": 2,
    "expectedTotal": 39.98
  },
  {
    "productId": 102,
    "quantity": 1,
    "expectedTotal": 99.99
  }
]
```

**Collection:**
```
📁 Order Flow
  ├── 1. Create Order
  └── 2. Verify Order Total
```

**Request 1 - Create Order - Pre-request:**
```javascript
const productId = pm.iterationData.get('productId');
const quantity = pm.iterationData.get('quantity');

pm.environment.set('order_productId', productId);
pm.environment.set('order_quantity', quantity);
```

**Request 1 - Test:**
```javascript
pm.test("Order created", function() {
  const order = pm.response.json();
  pm.environment.set('order_id', order.id);
  
  const expectedTotal = parseFloat(pm.iterationData.get('expectedTotal'));
  pm.expect(order.total).to.equal(expectedTotal);
});
```

**Request 2 - Verify Order - Pre-request:**
```javascript
// URL: GET /orders/{{order_id}}
// Uses order_id from previous request
```

**Request 2 - Test:**
```javascript
pm.test("Order total matches", function() {
  const order = pm.response.json();
  const expectedTotal = parseFloat(pm.iterationData.get('expectedTotal'));
  pm.expect(order.total).to.equal(expectedTotal);
});
```

### Pattern 2: Dynamic Test Name

```javascript
const username = pm.iterationData.get('username');
const testType = pm.iterationData.get('testType');

pm.test(`${testType}: User ${username} processed correctly`, function() {
  pm.response.to.have.status(200);
});
```

**Result:**
```
✅ Positive Test: User john_doe processed correctly
✅ Negative Test: User invalid_user processed correctly
```

### Pattern 3: Conditional Logic Based on Data

```javascript
const userRole = pm.iterationData.get('role');

if (userRole === 'admin') {
  pm.test("Admin has elevated permissions", function() {
    const response = pm.response.json();
    pm.expect(response.permissions).to.include('delete');
    pm.expect(response.permissions).to.include('modify');
  });
} else if (userRole === 'user') {
  pm.test("User has basic permissions", function() {
    const response = pm.response.json();
    pm.expect(response.permissions).to.include('read');
    pm.expect(response.permissions).to.not.include('delete');
  });
}
```

---

## Data File Management

### Upload Data File

1. **Workspace Settings** → **Data Files** tab
2. Click **"Upload Data File"**
3. Select file (CSV or JSON)
4. File is parsed and validated
5. Preview shows structure

### View Uploaded Files

![Data Files List](../assets/screenshots/data-files-list.png)

List shows:
- File name
- Type (CSV/JSON)
- Rows count
- Upload date
- Actions (Download, Delete)

### Update Data File

1. Delete old file
2. Upload new version with same name
3. Collection runs will use new data

### Download Data File

1. Find file in Data Files list
2. Click **"Download"** button
3. File downloads in original format

### Delete Data File

1. Find file in Data Files list
2. Click **"Delete"** button
3. Confirm deletion
4. File removed (collection runs will fail if they reference it)

---

## Best Practices

### ✅ DO:
- **Use descriptive column names**: `username`, not `un` or `col1`
- **Add test description column**: Makes results easier to understand
- **Include expected results**: `expectedStatus`, `expectedMessage` columns
- **Test edge cases**: Empty, null, max values, special characters
- **Keep data files manageable**: 100s of rows okay, 1000s might be slow
- **Document data format**: Add README or comments explaining columns
- **Version control data files**: Track changes with Git

### ❌ DON'T:
- **Don't hardcode values**: Use data file for all variations
- **Don't mix test types**: Separate positive/negative tests into different files
- **Don't use overly large files**: Split into multiple files if needed
- **Don't forget to clean up**: Delete test data created during iterations
- **Don't reuse IDs**: Generate unique values per iteration
- **Don't skip validation**: Always test that data was used correctly

---

## Troubleshooting

### Data Not Accessible in Scripts

**Symptom:**
```javascript
const username = pm.iterationData.get('username'); // undefined
```

**Solutions:**
1. Verify column name matches exactly (case-sensitive)
2. Check data file uploaded correctly
3. Ensure collection run selected the data file
4. Preview data file to verify structure

### Wrong Data Type

**Symptom:**
```javascript
const age = pm.iterationData.get('age'); // "25" (string, not number)
```

**Solution:**
```javascript
// CSV always returns strings, convert as needed
const age = parseInt(pm.iterationData.get('age'));
const price = parseFloat(pm.iterationData.get('price'));
const isActive = pm.iterationData.get('isActive') === 'true';
```

### Iterations Count Wrong

**Symptom:** Expected 5 iterations, got 1

**Solutions:**
1. Verify data file uploaded successfully
2. Check file format (should be array for JSON, rows for CSV)
3. Ensure "Data File" selected in Collection Runner
4. Preview file shows correct row count

### Request Fails on Specific Iteration

**Symptom:** Iteration 3 fails, others pass

**Debug:**
```javascript
// Log iteration data
console.log('=== Iteration Data ===');
console.log('Username:', pm.iterationData.get('username'));
console.log('Email:', pm.iterationData.get('email'));
console.log('Age:', pm.iterationData.get('age'));

// Check for missing/invalid data
const age = pm.iterationData.get('age');
if (!age || isNaN(parseInt(age))) {
  console.error('❌ Invalid age data:', age);
}
```

**Check:**
- Row 3 of data file for invalid/missing values
- Special characters causing issues
- Data type mismatches

---

## Example: Complete Data-Driven Test Suite

**Data file: user_test_suite.csv**
```csv
testCase,username,email,age,role,expectedStatus,shouldCreateUser
Valid User,john_doe,john@example.com,25,user,201,true
Admin User,admin_user,admin@example.com,30,admin,201,true
Minor User,minor_user,minor@example.com,15,user,400,false
Duplicate Email,dup_user,john@example.com,25,user,409,false
Invalid Email,invalid,notanemail,25,user,400,false
Negative Age,neg_user,neg@example.com,-5,user,400,false
Very Old,old_user,old@example.com,150,user,400,false
Missing Username,,user@example.com,25,user,400,false
Missing Email,no_email,,25,user,400,false
```

**Collection: User API Test Suite**
```
📁 User API Test Suite
  └── Create User (POST /users)
```

**Pre-request Script:**
```javascript
const testCase = pm.iterationData.get('testCase');
const username = pm.iterationData.get('username') || '';
const email = pm.iterationData.get('email') || '';
const age = pm.iterationData.get('age');
const role = pm.iterationData.get('role') || 'user';

pm.environment.set('test_username', username);
pm.environment.set('test_email', email);
pm.environment.set('test_age', age);
pm.environment.set('test_role', role);

console.log(`Test Case: ${testCase}`);
```

**Test Script:**
```javascript
const testCase = pm.iterationData.get('testCase');
const expectedStatus = parseInt(pm.iterationData.get('expectedStatus'));
const shouldCreateUser = pm.iterationData.get('shouldCreateUser') === 'true';

pm.test(`[${testCase}] Response status is ${expectedStatus}`, function() {
  pm.expect(pm.response.code).to.equal(expectedStatus);
});

if (shouldCreateUser) {
  pm.test(`[${testCase}] User created with ID`, function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('id');
  });
} else {
  pm.test(`[${testCase}] Error message provided`, function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('error');
  });
}
```

**Run Results:**
```
Iteration 1 (Valid User):        ✅ 2/2 passed
Iteration 2 (Admin User):        ✅ 2/2 passed
Iteration 3 (Minor User):        ✅ 2/2 passed
Iteration 4 (Duplicate Email):   ✅ 2/2 passed
Iteration 5 (Invalid Email):     ✅ 2/2 passed
Iteration 6 (Negative Age):      ✅ 2/2 passed
Iteration 7 (Very Old):          ✅ 2/2 passed
Iteration 8 (Missing Username):  ✅ 2/2 passed
Iteration 9 (Missing Email):     ✅ 2/2 passed

Summary: 18/18 tests passed ✅
Comprehensive user validation tested
```

---

## Related Topics

- [Collection Runner](collection-runner.md) - Execute collections with data files
- [Pre-request Scripts](pre-request-scripts.md) - Process data before requests
- [Test Scripts](test-scripts.md) - Validate data-driven results
- [Environments](../core-concepts/environments.md) - Store iteration data
- [Automated Testing Tutorial](../tutorials/automated-testing.md) - Build complete test suites
