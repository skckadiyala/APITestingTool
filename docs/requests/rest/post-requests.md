# POST Requests

**POST requests** create new resources on the server. They send data in the request body and are the primary method for adding new records to an API.

## What is a POST Request?

A POST request sends data to create a new resource. It's:

- **Not Safe**: Modifies server state (creates data)
- **Not Idempotent**: Multiple identical POSTs create multiple resources
- **Has Body**: Contains the data to create
- **Returns Created Resource**: Usually returns the new resource with ID

**Examples**:
- Create a new user account
- Submit a form
- Upload a file
- Add an item to a database
- Place an order

---

## Creating a POST Request

![POST Request](../assets/screenshots/request-builder-post-method.png)

**To create a POST request:**

1. Click **+ New** → **New Request**
2. Configure:
   - **Name**: "Create User"
   - **Method**: POST
   - **URL**: `{{baseUrl}}/api/users`
3. Add request body (JSON, form-data, etc.)
4. Click **Create**

---

## Simple POST Request

### Basic Example

**Request**:
```
POST https://jsonplaceholder.typicode.com/users
Content-Type: application/json
```

**Body**:
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "phone": "1-555-123-4567"
}
```

**Response** (201 Created):
```json
{
  "id": 11,
  "name": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "phone": "1-555-123-4567"
}
```

### With Variables

**Request**:
```
POST {{baseUrl}}/users
```

**Body**:
```json
{
  "name": "{{userName}}",
  "email": "{{userEmail}}",
  "role": "{{userRole}}"
}
```

**Pre-Request Script**:
```javascript
// Set dynamic data
pm.environment.set('userName', 'John Doe');
pm.environment.set('userEmail', `test.${Date.now()}@example.com`);
pm.environment.set('userRole', 'user');
```

---

## Request Body Types

### 1. JSON Body

Most common format for modern APIs.

![JSON Body](../assets/screenshots/body-tab-json.png)

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "active": true,
  "roles": ["user", "admin"],
  "metadata": {
    "department": "Engineering",
    "level": "senior"
  }
}
```

**Test Script**:
```javascript
pm.test("User created successfully", function() {
    pm.response.to.have.status(201);
});

pm.test("Response contains user ID", function() {
    const user = pm.response.json();
    pm.expect(user).to.have.property('id');
    pm.expect(user.id).to.be.a('number');
});

// Save user ID for later use
const userId = pm.response.json().id;
pm.environment.set('createdUserId', userId);
```

### 2. Form Data (multipart/form-data)

Used for file uploads and form submissions.

![Form Data](../assets/screenshots/body-tab-form-data.png)

**Headers** (auto-generated):
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

**Body**:

| Key | Value | Type | Description |
|-----|-------|------|-------------|
| `username` | `johndoe` | Text | Username |
| `email` | `john@example.com` | Text | Email |
| `avatar` | `[Select File]` | File | Profile picture |
| `resume` | `[Select File]` | File | Resume PDF |

**Test Script**:
```javascript
pm.test("File uploaded successfully", function() {
    pm.response.to.have.status(201);
});

pm.test("Response includes file URL", function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('avatarUrl');
    pm.expect(response.avatarUrl).to.be.a('string');
});
```

### 3. URL-Encoded Form

Traditional HTML form format.

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Body**:
```
username=johndoe&email=john@example.com&password=secretpass123
```

**Or in key-value format**:

| Key | Value |
|-----|-------|
| `username` | `johndoe` |
| `email` | `john@example.com` |
| `password` | `{{userPassword}}` |

### 4. Raw Body

For XML, plain text, or custom formats.

**XML Example**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<user>
    <name>John Doe</name>
    <email>john@example.com</email>
    <role>admin</role>
</user>
```

**Headers**:
```
Content-Type: application/xml
```

---

## POST Request Examples

### 1. Create User

**Request**:
```
POST {{baseUrl}}/users
Content-Type: application/json
```

**Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

**Response** (201 Created):
```json
{
  "id": 42,
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Test Script**:
```javascript
pm.test("User created with correct status", function() {
    pm.response.to.have.status(201);
});

pm.test("User has all required fields", function() {
    const user = pm.response.json();
    pm.expect(user).to.have.all.keys('id', 'name', 'email', 'role', 'createdAt');
});

pm.test("Password not returned", function() {
    const user = pm.response.json();
    pm.expect(user).to.not.have.property('password');
});

// Save for cleanup
pm.environment.set('createdUserId', pm.response.json().id);
```

### 2. Login / Authentication

**Request**:
```
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

**Body**:
```json
{
  "email": "admin@example.com",
  "password": "{{adminPassword}}"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Test Script**:
```javascript
pm.test("Login successful", function() {
    pm.response.to.have.status(200);
});

pm.test("Response contains tokens", function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('accessToken');
    pm.expect(response).to.have.property('refreshToken');
});

// Save tokens for subsequent requests
const response = pm.response.json();
pm.environment.set('authToken', response.accessToken);
pm.environment.set('refreshToken', response.refreshToken);

// Calculate expiry time
const expiryTime = Date.now() + (response.expiresIn * 1000);
pm.environment.set('tokenExpiry', expiryTime);

console.log('Auth token saved, expires in', response.expiresIn, 'seconds');
```

### 3. Create with Nested Data

**Request**:
```
POST {{baseUrl}}/orders
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

**Body**:
```json
{
  "userId": {{userId}},
  "items": [
    {
      "productId": 101,
      "quantity": 2,
      "price": 29.99
    },
    {
      "productId": 102,
      "quantity": 1,
      "price": 49.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA",
    "zipCode": "10001"
  },
  "paymentMethod": "credit_card"
}
```

**Response** (201 Created):
```json
{
  "id": 1001,
  "userId": 42,
  "total": 109.97,
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z",
  "items": [...],
  "shippingAddress": {...}
}
```

**Test Script**:
```javascript
pm.test("Order created", function() {
    pm.response.to.have.status(201);
});

pm.test("Total calculated correctly", function() {
    const order = pm.response.json();
    pm.expect(order.total).to.equal(109.97);
});

pm.test("Order has pending status", function() {
    const order = pm.response.json();
    pm.expect(order.status).to.equal('pending');
});

// Save order ID for tracking
pm.environment.set('orderId', pm.response.json().id);
```

### 4. Upload File

**Request**:
```
POST {{baseUrl}}/files/upload
Authorization: Bearer {{authToken}}
```

**Body** (form-data):

| Key | Value | Type |
|-----|-------|------|
| `file` | `[Select File]` | File |
| `title` | `My Document` | Text |
| `description` | `Important file` | Text |
| `category` | `documents` | Text |

**Response** (201 Created):
```json
{
  "id": 501,
  "filename": "document.pdf",
  "size": 1048576,
  "mimeType": "application/pdf",
  "url": "https://storage.example.com/files/501/document.pdf",
  "uploadedAt": "2024-01-15T10:30:00Z"
}
```

**Test Script**:
```javascript
pm.test("File uploaded", function() {
    pm.response.to.have.status(201);
});

pm.test("Response contains file URL", function() {
    const file = pm.response.json();
    pm.expect(file).to.have.property('url');
    pm.expect(file.url).to.include('https://');
});

pm.test("File size recorded", function() {
    const file = pm.response.json();
    pm.expect(file.size).to.be.a('number');
    pm.expect(file.size).to.be.above(0);
});

// Save file URL
pm.environment.set('uploadedFileUrl', pm.response.json().url);
```

### 5. Bulk Create

**Request**:
```
POST {{baseUrl}}/users/bulk
Content-Type: application/json
Authorization: Bearer {{authToken}}
```

**Body**:
```json
{
  "users": [
    {
      "name": "User 1",
      "email": "user1@example.com"
    },
    {
      "name": "User 2",
      "email": "user2@example.com"
    },
    {
      "name": "User 3",
      "email": "user3@example.com"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "created": 3,
  "users": [
    { "id": 101, "name": "User 1", "email": "user1@example.com" },
    { "id": 102, "name": "User 2", "email": "user2@example.com" },
    { "id": 103, "name": "User 3", "email": "user3@example.com" }
  ]
}
```

**Test Script**:
```javascript
pm.test("All users created", function() {
    const response = pm.response.json();
    pm.expect(response.created).to.equal(3);
    pm.expect(response.users).to.have.lengthOf(3);
});

pm.test("All users have IDs", function() {
    const users = pm.response.json().users;
    users.forEach(user => {
        pm.expect(user).to.have.property('id');
        pm.expect(user.id).to.be.a('number');
    });
});

// Save IDs for cleanup
const userIds = pm.response.json().users.map(u => u.id);
pm.environment.set('bulkUserIds', JSON.stringify(userIds));
```

---

## Dynamic Data Generation

### Generate Test Data

**Pre-Request Script**:
```javascript
// Random email
const randomEmail = `test.${Date.now()}@example.com`;
pm.environment.set('testEmail', randomEmail);

// Random username
const randomUsername = `user_${Math.random().toString(36).substring(7)}`;
pm.environment.set('testUsername', randomUsername);

// Timestamp
pm.environment.set('timestamp', new Date().toISOString());

// Random number
pm.environment.set('randomNumber', Math.floor(Math.random() * 1000));

// UUID
const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});
pm.environment.set('uuid', uuid);
```

**Body**:
```json
{
  "id": "{{uuid}}",
  "username": "{{testUsername}}",
  "email": "{{testEmail}}",
  "createdAt": "{{timestamp}}",
  "orderNumber": {{randomNumber}}
}
```

---

## Testing POST Requests

### Status Code Tests

```javascript
// Success - resource created
pm.test("Status is 201 Created", function() {
    pm.response.to.have.status(201);
});

// Success - operation completed
pm.test("Status is 200 OK", function() {
    pm.response.to.have.status(200);
});

// Bad request
pm.test("Validation failed - 400", function() {
    pm.response.to.have.status(400);
});

// Unauthorized
pm.test("Requires auth - 401", function() {
    pm.response.to.have.status(401);
});

// Conflict (duplicate)
pm.test("Duplicate detected - 409", function() {
    pm.response.to.have.status(409);
});
```

### Response Validation

```javascript
pm.test("Response contains created resource", function() {
    const resource = pm.response.json();
    pm.expect(resource).to.have.property('id');
    pm.expect(resource.id).to.not.be.null;
});

pm.test("Created resource matches request", function() {
    const sent = JSON.parse(pm.request.body);
    const received = pm.response.json();
    
    pm.expect(received.name).to.equal(sent.name);
    pm.expect(received.email).to.equal(sent.email);
});

pm.test("Timestamps are valid", function() {
    const resource = pm.response.json();
    const createdAt = new Date(resource.createdAt);
    pm.expect(createdAt).to.be.a('date');
    pm.expect(createdAt.getTime()).to.be.below(Date.now());
});
```

### Location Header

```javascript
pm.test("Location header present", function() {
    pm.response.to.have.header('Location');
});

pm.test("Location points to created resource", function() {
    const location = pm.response.headers.get('Location');
    const resourceId = pm.response.json().id;
    pm.expect(location).to.include(`/users/${resourceId}`);
});
```

---

## Error Handling

### Validation Errors (400)

**Response**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email format is invalid"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Test**:
```javascript
pm.test("Validation errors detailed", function() {
    const response = pm.response.json();
    pm.expect(response).to.have.property('details');
    pm.expect(response.details).to.be.an('array');
    pm.expect(response.details[0]).to.have.property('field');
    pm.expect(response.details[0]).to.have.property('message');
});
```

### Duplicate Resource (409)

**Response**:
```json
{
  "error": "Conflict",
  "message": "User with email 'john@example.com' already exists"
}
```

**Test**:
```javascript
pm.test("Duplicate detected", function() {
    if (pm.response.code === 409) {
        const error = pm.response.json();
        pm.expect(error.message).to.include('already exists');
    }
});
```

---

## Best Practices

### Request Body

✅ **Do**:
- Include all required fields
- Use proper data types (numbers, booleans)
- Send only necessary data
- Validate JSON before sending

❌ **Don't**:
- Include IDs (server generates them)
- Send sensitive data unencrypted
- Use overly large payloads
- Include computed fields (server calculates)

### Headers

✅ **Do**:
```
Content-Type: application/json
Authorization: Bearer {{token}}
Accept: application/json
```

❌ **Don't**:
```
# Missing Content-Type
# Wrong auth format
# Unnecessary headers
```

### Response Handling

✅ **Do**:
- Check for 201 status
- Extract and save resource ID
- Validate created resource
- Handle errors gracefully

❌ **Don't**:
- Assume success
- Ignore validation errors
- Skip ID extraction
- Create without cleanup

---

## Related Topics

<div class="grid cards" markdown>

-   :material-pencil:{ .lg .middle } **PUT/PATCH Requests**

    ---

    Update existing resources

    [:octicons-arrow-right-24: PUT/PATCH Guide](put-patch.md)

-   :material-delete:{ .lg .middle } **DELETE Requests**

    ---

    Remove resources from API

    [:octicons-arrow-right-24: DELETE Guide](delete-requests.md)

-   :material-file-document:{ .lg .middle } **Request Body**

    ---

    Master different body formats

    [:octicons-arrow-right-24: Request Body Guide](request-body.md)

</div>

---

## Frequently Asked Questions

??? question "What's the difference between POST and PUT?"
    POST creates new resources (server assigns ID). PUT replaces existing resources (client provides ID).

??? question "Should POST be idempotent?"
    No, POST is not idempotent. Multiple identical POSTs create multiple resources.

??? question "Can I send files with JSON?"
    No, use form-data (multipart/form-data) for file uploads. Or send file as base64 in JSON (not recommended for large files).

??? question "What status code should POST return?"
    201 Created for new resources, 200 OK for operations that don't create resources.

??? question "How do I handle duplicate POST requests?"
    Return 409 Conflict if duplicate detected. Consider idempotency keys for critical operations.

??? question "Should I return the created resource?"
    Yes, typically return the created resource with its ID and any server-generated fields.
