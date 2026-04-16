# PUT & PATCH Requests

Learn how to update resources using PUT and PATCH HTTP methods in Simba.

---

## Overview

**PUT** and **PATCH** are HTTP methods used to update existing resources:

- **PUT** - Replaces the entire resource with new data
- **PATCH** - Partially updates specific fields of a resource

**Key Difference:**
```
PUT:   Send complete resource (all fields)
PATCH: Send only changed fields
```

---

## PUT Requests

### When to Use PUT

Use PUT when you want to:
- ✅ Replace an entire resource
- ✅ Update all fields of a resource
- ✅ Create a resource if it doesn't exist (if API supports it)

### Basic PUT Request

**Example: Update complete user profile**

```
Method: PUT
URL: https://jsonplaceholder.typicode.com/users/1

Headers:
  Content-Type: application/json

Body (JSON):
{
  "id": 1,
  "name": "John Smith",
  "username": "johnsmith",
  "email": "john.smith@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipcode": "10001"
  },
  "phone": "555-1234",
  "website": "johnsmith.com",
  "company": {
    "name": "Smith Corp",
    "catchPhrase": "Innovation First"
  }
}
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "John Smith",
  "username": "johnsmith",
  "email": "john.smith@example.com",
  // ... all fields returned
}
```

### PUT Test Script

```javascript
pm.test("Status code is 200", () => {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("User updated successfully", () => {
    const user = pm.response.json();
    pm.expect(user.name).to.equal("John Smith");
    pm.expect(user.email).to.equal("john.smith@example.com");
});

pm.test("Response contains all fields", () => {
    const user = pm.response.json();
    pm.expect(user).to.have.property('id');
    pm.expect(user).to.have.property('name');
    pm.expect(user).to.have.property('email');
    pm.expect(user).to.have.property('address');
    pm.expect(user).to.have.property('phone');
});

pm.test("ID unchanged", () => {
    const user = pm.response.json();
    pm.expect(user.id).to.equal(1);
});
```

---

## PATCH Requests

### When to Use PATCH

Use PATCH when you want to:
- ✅ Update specific fields only
- ✅ Save bandwidth (send less data)
- ✅ Prevent unintentional overwrites
- ✅ Perform atomic updates

### Basic PATCH Request

**Example: Update only user's email**

```
Method: PATCH
URL: https://jsonplaceholder.typicode.com/users/1

Headers:
  Content-Type: application/json

Body (JSON):
{
  "email": "newemail@example.com"
}
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "newemail@example.com",  // ← Only this changed
  "address": { ... },  // ← Other fields unchanged
  "phone": "1-770-736-8031",
  "website": "hildegard.org",
  "company": { ... }
}
```

### PATCH Test Script

```javascript
pm.test("Status code is 200", () => {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Email updated", () => {
    const user = pm.response.json();
    pm.expect(user.email).to.equal("newemail@example.com");
});

pm.test("Other fields unchanged", () => {
    const user = pm.response.json();
    pm.expect(user.name).to.equal("Leanne Graham");
    pm.expect(user.username).to.equal("Bret");
});

pm.test("Response time acceptable", () => {
    pm.expect(pm.response.time).to.be.below(500);
});
```

---

## PUT vs PATCH Comparison

### Example Scenario

**Original Resource:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "city": "New York"
}
```

**Update Request: Change only email**

**Using PUT (must send all fields):**
```json
// PUT /users/1
{
  "id": 1,
  "name": "John Doe",
  "email": "johndoe@newdomain.com",  // ← Changed
  "age": 30,
  "city": "New York"
}
```

**Using PATCH (send only changed field):**
```json
// PATCH /users/1
{
  "email": "johndoe@newdomain.com"  // ← Only changed field
}
```

### Behavior Differences

| Aspect | PUT | PATCH |
|--------|-----|-------|
| **Payload Size** | Full resource | Only changed fields |
| **Unspecified Fields** | Removed/reset to default | Unchanged |
| **Idempotent** | Yes | Depends on implementation |
| **Use Case** | Replace entire resource | Partial update |
| **Bandwidth** | Higher | Lower |

---

## Advanced PUT/PATCH Patterns

### 1. Conditional Updates with ETags

**Prevent concurrent update conflicts:**

```
Method: PUT
URL: https://api.example.com/users/1

Headers:
  Content-Type: application/json
  If-Match: "686897696a7c876b7e"  // ← ETag from GET request

Body:
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Test for conflicts:**
```javascript
pm.test("Update successful or conflict detected", () => {
    const statusCode = pm.response.code;
    
    if (statusCode === 200) {
        console.log("✅ Update successful");
    } else if (statusCode === 412) {
        console.log("⚠️ Precondition failed - resource was modified");
    } else {
        pm.expect.fail(`Unexpected status: ${statusCode}`);
    }
});
```

### 2. Partial Update with PATCH (JSON Patch)

**JSON Patch format (RFC 6902):**

```
Method: PATCH
URL: https://api.example.com/users/1

Headers:
  Content-Type: application/json-patch+json

Body:
[
  { "op": "replace", "path": "/email", "value": "new@example.com" },
  { "op": "add", "path": "/phone", "value": "555-9999" },
  { "op": "remove", "path": "/age" }
]
```

**Operations:**
- `replace` - Update existing field
- `add` - Add new field or append to array
- `remove` - Delete field
- `move` - Move value between paths
- `copy` - Copy value to another path
- `test` - Verify value before applying patches

### 3. Bulk Update with PUT

**Update multiple resources:**

```
Method: PUT
URL: https://api.example.com/users/bulk

Body:
[
  { "id": 1, "status": "active" },
  { "id": 2, "status": "active" },
  { "id": 3, "status": "inactive" }
]
```

### 4. Upsert Pattern (PUT)

**Create if not exists, update if exists:**

```
Method: PUT
URL: https://api.example.com/users/john-doe

Body:
{
  "username": "john-doe",
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Test script:**
```javascript
pm.test("Upsert successful", () => {
    const status = pm.response.code;
    
    if (status === 200) {
        console.log("✅ Resource updated");
    } else if (status === 201) {
        console.log("✅ Resource created");
    } else {
        pm.expect.fail(`Unexpected status: ${status}`);
    }
});
```

---

## Using Variables in PUT/PATCH

### Pre-request Script - Prepare Update Data

```javascript
// Get current user data from previous request
const userId = pm.environment.get('userId');

// Modify specific fields
const updateData = {
    name: "Updated Name",
    email: `user${Date.now()}@example.com`,
    updatedAt: new Date().toISOString()
};

// Store for use in request body
pm.environment.set('updateData', JSON.stringify(updateData));
```

**Request Body:**
```json
{{updateData}}
```

### Dynamic Field Updates

**Pre-request Script:**
```javascript
// Get fields to update from collection variables
const fieldsToUpdate = pm.collectionVariables.get('fieldsToUpdate') || [];

// Build PATCH body dynamically
const patchBody = {};
fieldsToUpdate.forEach(field => {
    patchBody[field.name] = field.value;
});

pm.environment.set('patchBody', JSON.stringify(patchBody));
```

---

## Error Handling

### Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **200 OK** | Update successful | ✅ Resource updated |
| **201 Created** | Resource created (upsert) | ✅ New resource created |
| **204 No Content** | Update successful, no body | ✅ Success, no response data |
| **400 Bad Request** | Invalid data | ❌ Check request body |
| **404 Not Found** | Resource doesn't exist | ❌ Check resource ID |
| **409 Conflict** | Concurrent modification | ❌ Retry with latest data |
| **412 Precondition Failed** | ETag mismatch | ❌ Fetch latest version |
| **422 Unprocessable Entity** | Validation errors | ❌ Fix validation issues |

### Test for Common Errors

```javascript
pm.test("Update validation", () => {
    const status = pm.response.code;
    
    if (status === 400) {
        const error = pm.response.json();
        console.log("Validation error:", error.message);
        pm.expect(error).to.have.property('message');
    } else if (status === 404) {
        console.log("Resource not found");
    } else if (status === 409) {
        console.log("Conflict - resource was modified");
    } else {
        pm.expect(status).to.be.oneOf([200, 201, 204]);
    }
});

pm.test("Response has valid structure", () => {
    if (pm.response.code === 200 || pm.response.code === 201) {
        const data = pm.response.json();
        pm.expect(data).to.be.an('object');
        pm.expect(data).to.have.property('id');
    }
});
```

---

## Best Practices

### ✅ DO

**Use PUT for complete replacements:**
```javascript
// ✅ All required fields included
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active",
  "role": "admin"
}
```

**Use PATCH for partial updates:**
```javascript
// ✅ Only changed fields
{
  "status": "inactive"
}
```

**Validate before updating:**
```javascript
pm.test("Data validation before update", () => {
    const email = pm.variables.get('newEmail');
    pm.expect(email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});
```

**Save updated resource ID:**
```javascript
const updated = pm.response.json();
pm.environment.set('lastUpdatedId', updated.id);
pm.environment.set('lastUpdatedEmail', updated.email);
```

### ❌ DON'T

**Don't use PUT for partial updates:**
```javascript
// ❌ Missing required fields
// PUT /users/1
{
  "email": "new@example.com"  // Other fields will be lost!
}
```

**Don't update without checking existence:**
```javascript
// ❌ No validation
// PUT /users/999999
```

**Don't ignore response validation:**
```javascript
// ❌ No checks
pm.test("Just check status", () => {
    pm.expect(pm.response.code).to.equal(200);
});

// ✅ Validate response data
pm.test("Update successful and validated", () => {
    const user = pm.response.json();
    pm.expect(user.email).to.equal(pm.variables.get('newEmail'));
});
```

---

## Complete Update Workflow

**Example: Update user profile workflow**

### 1. GET Current Data
```
GET /users/1
Save: currentUser
```

### 2. Modify Data (Pre-request Script)
```javascript
const currentUser = pm.response.json();
currentUser.email = "updated@example.com";
currentUser.updatedAt = new Date().toISOString();

pm.environment.set('updatedUser', JSON.stringify(currentUser));
```

### 3. PUT/PATCH Update
```
PUT /users/1
Body: {{updatedUser}}
```

### 4. Verify Update (Test Script)
```javascript
pm.test("Update verified", () => {
    const updated = pm.response.json();
    pm.expect(updated.email).to.equal("updated@example.com");
    pm.expect(updated.updatedAt).to.exist;
});
```

### 5. GET to Confirm
```
GET /users/1
Verify: email === "updated@example.com"
```

---

## Related Topics

- [POST Requests](post-requests.md) - Creating resources
- [DELETE Requests](delete-requests.md) - Removing resources
- [Headers](headers.md) - Request headers (If-Match, Content-Type)
- [Request Body](request-body.md) - Body formats and encoding
- [Test Scripts](../../advanced/test-scripts.md) - Advanced testing

---

*Need help? Check the [FAQ](../../reference/faq.md) or [Troubleshooting Guide](../../reference/troubleshooting.md)*
