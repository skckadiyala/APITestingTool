# DELETE Requests

Learn how to delete resources using the DELETE HTTP method in Simba.

---

## Overview

**DELETE** is an HTTP method used to remove resources from a server.

**Key Characteristics:**
- �� Removes a resource permanently
- ⚠️ Usually irreversible
- ✅ Idempotent (repeating has same effect)
- 📝 May return deleted data or confirmation

---

## Basic DELETE Request

### Simple Resource Deletion

**Example: Delete a user**

```
Method: DELETE
URL: https://jsonplaceholder.typicode.com/users/1

Headers:
  Authorization: Bearer {{authToken}}
```

**Expected Responses:**

**200 OK** (with deleted resource):
```json
{
  "id": 1,
  "name": "Leanne Graham",
  "email": "test@example.com",
  "deleted": true
}
```

**204 No Content** (successful, no body):
```
(Empty response)
```

**Test Script:**
```javascript
pm.test("Delete successful", () => {
    pm.expect(pm.response.code).to.be.oneOf([200, 204]);
});

pm.test("Response time acceptable", () => {
    pm.expect(pm.response.time).to.be.below(500);
});

// If 200 response with body
if (pm.response.code === 200) {
    pm.test("Deleted resource returned", () => {
        const data = pm.response.json();
        pm.expect(data).to.have.property('id');
    });
}
```

---

## DELETE with Path Parameters

### Delete Specific Resource

```
Method: DELETE
URL: https://api.example.com/posts/{{postId}}
```

**Pre-request Script:**
```javascript
// Get ID from environment
const postId = pm.environment.get('postId');

if (!postId) {
    throw new Error('postId not set in environment');
}

console.log(`Deleting post ID: ${postId}`);
```

**Test Script:**
```javascript
pm.test("Post deleted", () => {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Deleted post ID matches", () => {
    const data = pm.response.json();
    const expectedId = parseInt(pm.environment.get('postId'));
    pm.expect(data.id).to.equal(expectedId);
});

// Clear deleted ID from environment
pm.environment.unset('postId');
```

---

## DELETE with Query Parameters

### Delete with Filters

**Example: Delete all posts by user**

```
Method: DELETE
URL: https://api.example.com/posts?userId=1&permanent=true

Headers:
  Authorization: Bearer {{authToken}}
```

**Query Parameters:**
```
userId: 1
permanent: true
confirm: yes
```

**Test Script:**
```javascript
pm.test("Bulk delete successful", () => {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Delete count returned", () => {
    const result = pm.response.json();
    pm.expect(result).to.have.property('deletedCount');
    pm.expect(result.deletedCount).to.be.above(0);
    
    console.log(`Deleted ${result.deletedCount} posts`);
});
```

---

## Soft Delete vs Hard Delete

### Soft Delete (Logical Deletion)

Resource marked as deleted but remains in database:

```
Method: DELETE (or PATCH)
URL: https://api.example.com/users/1

Response:
{
  "id": 1,
  "name": "John Doe",
  "deleted": true,
  "deletedAt": "2026-04-16T10:30:00Z"
}
```

**Benefits:**
- ✅ Can be restored
- ✅ Maintains referential integrity
- ✅ Audit trail preserved

### Hard Delete (Physical Deletion)

Resource permanently removed from database:

```
Method: DELETE
URL: https://api.example.com/users/1?permanent=true

Response:
204 No Content
```

**Characteristics:**
- ⚠️ Cannot be undone
- 🔒 Better for privacy/GDPR compliance
- 💾 Frees storage space

---

## Delete with Request Body

Some APIs accept DELETE with body (non-standard but used):

```
Method: DELETE
URL: https://api.example.com/posts/bulk

Headers:
  Content-Type: application/json

Body:
{
  "ids": [1, 2, 3, 4, 5],
  "reason": "Spam content",
  "confirmedBy": "admin@example.com"
}
```

**Test Script:**
```javascript
pm.test("Bulk delete successful", () => {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("All items deleted", () => {
    const result = pm.response.json();
    const requestIds = [1, 2, 3, 4, 5];
    
    pm.expect(result.deletedIds).to.be.an('array');
    pm.expect(result.deletedIds.length).to.equal(requestIds.length);
    
    requestIds.forEach(id => {
        pm.expect(result.deletedIds).to.include(id);
    });
});
```

---

## Conditional Deletion

### Delete with Confirmation

**Require confirmation token:**

```
Method: DELETE
URL: https://api.example.com/accounts/{{accountId}}

Headers:
  Authorization: Bearer {{authToken}}
  X-Confirm-Token: {{confirmToken}}
```

**Pre-request Script (get confirmation token):**
```javascript
// Request confirmation token first
pm.sendRequest({
    url: pm.environment.get('baseUrl') + '/accounts/confirm-delete',
    method: 'POST',
    header: {
        'Authorization': 'Bearer ' + pm.environment.get('authToken'),
        'Content-Type': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            accountId: pm.environment.get('accountId'),
            password: pm.environment.get('password')
        })
    }
}, (err, res) => {
    if (!err && res.code === 200) {
        const confirmToken = res.json().token;
        pm.environment.set('confirmToken', confirmToken);
        console.log('✅ Confirmation token obtained');
    } else {
        console.log('❌ Failed to get confirmation token');
    }
});
```

### Delete with ETag

**Prevent deleting modified resource:**

```
Method: DELETE
URL: https://api.example.com/posts/1

Headers:
  If-Match: "686897696a7c876b7e"
```

**Test Script:**
```javascript
pm.test("Delete or conflict", () => {
    const status = pm.response.code;
    
    if (status === 200 || status === 204) {
        console.log("✅ Resource deleted successfully");
    } else if (status === 412) {
        console.log("⚠️  Resource was modified, cannot delete");
    } else {
        pm.expect.fail(`Unexpected status: ${status}`);
    }
});
```

---

## Delete Workflow Patterns

### Pattern 1: Verify Before Delete

```javascript
// 1. GET resource to verify it exists
pm.sendRequest(pm.environment.get('baseUrl') + '/users/1', (err, res) => {
    if (res.code === 200) {
        const user = res.json();
        console.log(`Deleting user: ${user.name}`);
        pm.environment.set('userToDelete', JSON.stringify(user));
    } else {
        console.log('User not found, skipping delete');
    }
});

// 2. DELETE request (in next request)
// 3. Verify deletion (GET should return 404)
```

### Pattern 2: Delete with Backup

**Pre-request Script:**
```javascript
// Backup resource before deleting
const resourceId = pm.environment.get('resourceId');

pm.sendRequest({
    url: `${pm.environment.get('baseUrl')}/posts/${resourceId}`,
    method: 'GET'
}, (err, res) => {
    if (!err && res.code === 200) {
        // Save backup
        pm.collectionVariables.set('deletedBackup', JSON.stringify(res.json()));
        console.log('✅ Backup saved');
    }
});
```

### Pattern 3: Cascade Delete

**Delete parent and all children:**

```
Method: DELETE
URL: https://api.example.com/collections/{{collectionId}}?cascade=true
```

**Test Script:**
```javascript
pm.test("Cascade delete successful", () => {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("All related resources deleted", () => {
    const result = pm.response.json();
    
    pm.expect(result).to.have.property('collection');
    pm.expect(result).to.have.property('deletedRequests');
    pm.expect(result).to.have.property('deletedFolders');
    
    console.log(`Deleted collection and ${result.deletedRequests} requests`);
});
```

---

## Error Handling

### Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **200 OK** | Deleted (with body) | ✅ Success |
| **204 No Content** | Deleted (no body) | ✅ Success |
| **202 Accepted** | Delete queued | ⏳ Check status later |
| **400 Bad Request** | Invalid request | ❌ Check parameters |
| **401 Unauthorized** | Not authenticated | ❌ Check auth token |
| **403 Forbidden** | No permission | ❌ Check permissions |
| **404 Not Found** | Resource doesn't exist | ⚠️ Already deleted or never existed |
| **409 Conflict** | Cannot delete (has dependencies) | ❌ Delete dependencies first |
| **410 Gone** | Already deleted | ⚠️ Resource permanently removed |

### Test for Errors

```javascript
pm.test("Delete request status", () => {
    const status = pm.response.code;
    
    switch(status) {
        case 200:
        case 204:
            console.log("✅ Delete successful");
            break;
        case 404:
            console.log("⚠️  Resource not found");
            break;
        case 409:
            const error = pm.response.json();
            console.log("❌ Cannot delete:", error.message);
            break;
        case 403:
            console.log("❌ Permission denied");
            break;
        default:
            pm.expect.fail(`Unexpected status: ${status}`);
    }
});

pm.test("Error response has details", () => {
    if (pm.response.code >= 400) {
        const error = pm.response.json();
        pm.expect(error).to.have.property('message');
    }
});
```

---

## Testing Deletions

### Verify Resource is Gone

**After DELETE, verify with GET:**

```javascript
// In DELETE test script
pm.test("Delete successful", () => {
    pm.expect(pm.response.code).to.be.oneOf([200, 204]);
});

// Save resource ID for verification
const deletedId = pm.environment.get('resourceId');
pm.collectionVariables.set('deletedResourceId', deletedId);

// Create follow-up GET request to verify 404
```

**Verification GET Request:**
```
Method: GET
URL: https://api.example.com/posts/{{deletedResourceId}}
```

**Test Script:**
```javascript
pm.test("Resource no longer exists", () => {
    pm.expect(pm.response.code).to.be.oneOf([404, 410]);
});

pm.test("Error message indicates deletion", () => {
    const error = pm.response.json();
    pm.expect(error.message).to.match(/not found|deleted|gone/i);
});

// Clean up
pm.collectionVariables.unset('deletedResourceId');
```

### Test Cascade Deletion

```javascript
pm.test("Parent deleted", () => {
    const result = pm.response.json();
    pm.expect(result.collection.deleted).to.be.true;
});

pm.test("Children deleted", () => {
    const result = pm.response.json();
    pm.expect(result.deletedRequests).to.be.above(0);
    console.log(`${result.deletedRequests} child resources deleted`);
});

// Verify child is gone
const childId = pm.collectionVariables.get('childResourceId');
pm.sendRequest({
    url: `${pm.environment.get('baseUrl')}/requests/${childId}`,
    method: 'GET'
}, (err, res) => {
    pm.test("Child resource deleted", () => {
        pm.expect(res.code).to.equal(404);
    });
});
```

---

## Safety Patterns

### 1. Confirmation Required

```javascript
// Pre-request script
const confirmDelete = pm.collectionVariables.get('confirmDelete');

if (confirmDelete !== 'YES') {
    throw new Error('Delete not confirmed! Set confirmDelete="YES" to proceed.');
}

console.log('⚠️  Proceeding with deletion...');
```

### 2. Dry Run Mode

```
Method: DELETE
URL: https://api.example.com/posts/1?dryRun=true
```

**Response shows what would be deleted:**
```json
{
  "dryRun": true,
  "wouldDelete": {
    "post": 1,
    "comments": 15,
    "likes": 42
  },
  "warning": "This is a dry run. No data was actually deleted."
}
```

### 3. Trash/Recycle Bin Pattern

```javascript
// Soft delete first
pm.test("Moved to trash", () => {
    const result = pm.response.json();
    pm.expect(result.status).to.equal('trashed');
    pm.expect(result.trashedAt).to.exist;
    
    // Can be restored within 30 days
    console.log('Resource moved to trash, restoreable until:', 
                result.permanentDeleteAt);
});
```

---

## Best Practices

### ✅ DO

**Verify authentication:**
```javascript
pm.test("Authenticated", () => {
    const token = pm.environment.get('authToken');
    pm.expect(token).to.exist;
});
```

**Check permissions before delete:**
```javascript
// Ensure user has delete permission
const userRole = pm.environment.get('userRole');
if (userRole !== 'admin' && userRole !== 'owner') {
    throw new Error('Insufficient permissions to delete');
}
```

**Log deletions:**
```javascript
const deleted = pm.response.json();
console.log('Deleted:', {
    id: deleted.id,
    type: deleted.type,
    timestamp: new Date().toISOString()
});

// Save to deletion history
const history = JSON.parse(pm.collectionVariables.get('deleteHistory') || '[]');
history.push({
    id: deleted.id,
    deletedAt: new Date().toISOString()
});
pm.collectionVariables.set('deleteHistory', JSON.stringify(history));
```

**Handle idempotency:**
```javascript
pm.test("Delete is idempotent", () => {
    const status = pm.response.code;
    
    // Both success cases
    if (status === 404 || status === 410) {
        console.log('Resource already deleted (idempotent)');
    } else {
        pm.expect(status).to.be.oneOf([200, 204]);
    }
});
```

### ❌ DON'T

**Don't delete without verification:**
```javascript
// ❌ Bad
DELETE /users/{{userId}}

// ✅ Good - verify first
if (pm.environment.get('userId') === '1') {
    throw new Error('Cannot delete system admin');
}
```

**Don't ignore delete failures:**
```javascript
// ❌ Bad - only check success
pm.test("Status 200", () => {
    pm.expect(pm.response.code).to.equal(200);
});

// ✅ Good - handle all cases
pm.test("Delete handled correctly", () => {
    const status = pm.response.code;
    
    if (status === 409) {
        console.log('Cannot delete - has dependencies');
    } else if (status === 403) {
        console.log('Permission denied');
    } else {
        pm.expect(status).to.be.oneOf([200, 204]);
    }
});
```

---

## Complete Delete Workflow Example

**Collection: Delete User Account**

### 1. Request: Verify User Exists
```
GET /users/{{userId}}
```

### 2. Request: Check Dependencies
```
GET /users/{{userId}}/dependencies

Test: Ensure no active subscriptions, pending orders, etc.
```

### 3. Request: Soft Delete (Move to Trash)
```
DELETE /users/{{userId}}

Test: User status = trashed
```

### 4. Request: Verify Soft Delete
```
GET /users/{{userId}}

Test: Status code 200, but user.deleted = true
```

### 5. Request: Hard Delete (After Confirmation)
```
DELETE /users/{{userId}}?permanent=true

Headers:
  X-Confirm-Token: {{confirmToken}}

Test: Status 204, resource permanently removed
```

### 6. Request: Verify Hard Delete
```
GET /users/{{userId}}

Test: Status 404 or 410
```

---

## Related Topics

- [POST Requests](post-requests.md) - Creating resources
- [PUT & PATCH](put-patch.md) - Updating resources
- [Request Headers](headers.md) - Authorization, If-Match
- [Test Scripts](../../advanced/test-scripts.md) - Advanced testing
- [Collection Runner](../../advanced/collection-runner.md) - Bulk deletions

---

*Need help? Check the [FAQ](../../reference/faq.md) or [Troubleshooting Guide](../../reference/troubleshooting.md)*
