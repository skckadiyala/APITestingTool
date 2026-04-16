# Request History

Request History automatically tracks every API request you send, allowing you to review past executions, debug issues, and re-execute requests with the same configuration.

---

## Overview

**What is Request History?**

Every time you send a request in Simba, it's automatically saved to your history with:
- Request details (method, URL, headers, body)
- Response data (status, headers, body, timing)
- Test results (passed/failed assertions)
- Execution timestamp
- Environment used

**Use cases:**
- **Debugging**: Review exactly what was sent when an issue occurred
- **Comparison**: Compare responses over time
- **Re-execution**: Run the same request again with identical configuration
- **Audit trail**: Track API usage and testing activities
- **Learning**: Study successful requests to understand API behavior

---

## Accessing Request History

### Method 1: History Sidebar

![History Sidebar](../assets/screenshots/history-sidebar.png)

1. Click the **"History"** icon in the left sidebar (clock icon)
2. See chronological list of all requests
3. Most recent at the top
4. Click any entry to view details

### Method 2: Request Context

1. Send a request from the Request Builder
2. Response appears in Response Viewer
3. Click **"History"** tab in Response panel
4. See all previous executions of this specific request

### Method 3: Search History

1. Go to History sidebar
2. Use search box at top
3. Filter by:
   - URL
   - Method (GET, POST, etc.)
   - Status code
   - Date range

---

## History Entry Details

### List View

Each history entry shows:
```
✅ GET https://api.example.com/users/123       200 OK    250ms
   2024-03-15 10:30:45 AM
```

Information displayed:
- **Status icon**: ✅ (success), ❌ (error)
- **HTTP method**: GET, POST, PUT, DELETE, etc.
- **URL**: Full request URL
- **Status**: HTTP status code and text
- **Response time**: Milliseconds
- **Timestamp**: When request was sent
- **Environment** (if applicable): Dev, Staging, Prod

### Detail View

Click on any history entry to see full details:

#### **Request Tab**
```
Method: GET
URL: https://api.example.com/users/123

Headers:
  Authorization: Bearer eyJhbGciOiJI...
  Content-Type: application/json
  User-Agent: Simba/1.0

Query Parameters:
  include: profile,settings
  format: json

Body: (none for GET requests)
```

#### **Response Tab**
```
Status: 200 OK
Time: 250ms
Size: 1.2 KB

Headers:
  Content-Type: application/json; charset=utf-8
  X-RateLimit-Remaining: 4999
  Date: Thu, 15 Mar 2024 10:30:45 GMT

Body:
{
  "id": 123,
  "username": "john_doe",
  "email": "john@example.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### **Tests Tab** (if tests were run)
```
✅ Status code is 200 OK
✅ Response has user ID
✅ Username matches expected
❌ Email is verified
```

#### **Console Tab** (script output)
```
✅ User retrieved successfully
User ID: 123
Response time: 250ms
```

---

## Re-executing from History

### Method 1: Load to Request Builder

![Load from History](../assets/screenshots/history-load-request.png)

1. Find request in History
2. Click **"Load to Builder"** or double-click entry
3. Request opens in a new tab
4. All settings preserved (headers, body, auth)
5. Make modifications if needed
6. Send again

### Method 2: Re-run Directly

1. Right-click on history entry
2. Select **"Re-run Request"**
3. Request executes immediately with original configuration
4. New history entry created with result

### Method 3: Compare Responses

1. Select multiple history entries (Ctrl/Cmd + Click)
2. Click **"Compare"** button
3. Side-by-side view of responses
4. Highlights differences

---

## Filtering and Searching History

### Search by URL

```
Search: /api/users
Results: All requests to URLs containing "/api/users"
```

### Filter by Method

```
Filter: POST
Results: Only POST requests shown
```

### Filter by Status Code

```
Filter: 4xx
Results: All client error responses (400, 401, 404, etc.)

Filter: 200
Results: Only successful 200 OK responses
```

### Filter by Date Range

```
From: 2024-03-01
To: 2024-03-15
Results: All requests in this two-week period
```

### Combined Filters

```
URL: /users
Method: GET
Status: 200
Date: Last 7 days
Results: Successful GET requests to /users in past week
```

---

## Use Cases

### Use Case 1: Debugging Failed Request

**Scenario:** API call worked yesterday, fails today with 401

**Steps:**
1. Go to History
2. Filter: `URL: /api/data`, `Status: 200`, `Date: Yesterday`
3. Find successful request from yesterday
4. View **Request tab** → Check headers
5. Compare with today's failed request
6. **Discovery**: `Authorization` header missing in today's request
7. **Solution**: Token expired, need to refresh

### Use Case 2: Comparing Responses Over Time

**Scenario:** API returns different data intermittently

**Steps:**
1. Send same request multiple times
2. Go to History
3. Select 5 most recent executions
4. Click **"Compare Responses"**
5. **Discovery**: `status` field sometimes missing
6. **Conclusion**: API has intermittent bug

### Use Case 3: Performance Monitoring

**Scenario:** Check if API performance has degraded

**Steps:**
1. History → Filter by URL: `/api/dashboard`
2. Sort by date (newest first)
3. Check response times over past week:
   ```
   Today:      850ms ⚠️
   Yesterday:  420ms ✅
   2 days ago: 380ms ✅
   3 days ago: 400ms ✅
   ```
4. **Discovery**: Significant slowdown today
5. **Action**: Report performance issue

### Use Case 4: Test Data Cleanup

**Scenario:** Created test users, need to delete them

**Steps:**
1. History → Filter: `Method: POST`, `URL: /users`
2. View POST requests that created users
3. Extract user IDs from response bodies:
   ```
   Response 1: { "id": 123, ... }
   Response 2: { "id": 124, ... }
   Response 3: { "id": 125, ... }
   ```
4. Create DELETE requests for each ID
5. Clean up test data

### Use Case 5: Learning API Behavior

**Scenario:** New to API, want to understand authentication

**Steps:**
1. History → Filter: `URL: /auth/login`
2. View successful login requests
3. Study request headers, body structure
4. Check response to see token format
5. Load to Builder and experiment with modifications

---

## Real-World Examples

### Example 1: GitHub API Usage Tracking

**History entries:**
```
✅ GET /user/repos                200 OK  120ms  [Main Account]
✅ GET /repos/owner/repo/issues   200 OK  180ms  [Main Account]
✅ POST /repos/owner/repo/issues  201 OK  250ms  [Main Account]
❌ DELETE /repos/owner/repo       403 Forbidden  [Test Account]
```

**Analysis:**
- Main account can create issues ✅
- Test account lacks delete permissions ❌
- Create issue took longer than expected (250ms)
- Rate limit headers show 4,997 requests remaining

**Action:**
- Grant test account delete permissions
- Investigate create issue performance

### Example 2: JSONPlaceholder Testing

**History:**
```
✅ GET /posts           200 OK  95ms   (100 items)
✅ GET /posts/1         200 OK  80ms
✅ PUT /posts/1         200 OK  120ms
✅ DELETE /posts/1      200 OK  90ms
✅ GET /posts/1         404 Not Found  85ms
```

**Analysis:**
- Full CRUD flow completed successfully
- Final GET correctly returns 404 after delete
- Consistent response times (<150ms)
- All requests to correct domain

**Conclusion:** API behaves as documented ✅

### Example 3: Authentication Flow Debugging

**Failed Auth Flow:**
```
✅ POST /auth/register  201 Created     (user_id: 456)
✅ POST /auth/login     200 OK          (token saved)
❌ GET /api/profile     401 Unauthorized
```

**Debug Steps:**
1. View failed request details
2. Check headers:
   ```
   Authorization: Bearer {{access_token}}
   ```
3. Check if token was actually set:
   ```
   Environment: access_token = (undefined)
   ```
4. **Issue found**: Login test script failed to save token
5. **Fix**: Update test script:
   ```javascript
   pm.environment.set('access_token', response.token);
   ```
6. Re-run from history → Success ✅

---

## History Management

### Enable/Disable History Saving

**Settings → Preferences → History:**
```
☑ Save request history
☑ Save response bodies (increases storage)
☐ Save only Test Results (lighter storage)
Max history entries: 1000
```

### Clear History

**Clear all history:**
1. History sidebar → **Settings icon** (⚙️)
2. Click **"Clear All History"**
3. Confirm deletion
4. All history entries deleted (cannot be undone)

**Clear specific entries:**
1. Select entries (Ctrl/Cmd + Click for multiple)
2. Right-click → **"Delete Selected"**
3. Entries removed from history

**Auto-cleanup:**
```
Settings: Delete history older than 30 days
```
System automatically removes old entries.

### Export History

**Export to JSON:**
1. History sidebar → **⚙️ Settings**
2. Click **"Export History"**
3. Save as JSON file
4. Can be imported later or analyzed externally

**Export format:**
```json
[
  {
    "id": "uuid-123",
    "timestamp": "2024-03-15T10:30:45Z",
    "request": {
      "method": "GET",
      "url": "https://api.example.com/users/123",
      "headers": [...],
      "body": null
    },
    "response": {
      "status": 200,
      "statusText": "OK",
      "headers": [...],
      "body": "...",
      "responseTime": 250
    },
    "testResults": [...]
  }
]
```

### Import History

1. History sidebar → **⚙️ Settings**
2. Click **"Import History"**
3. Select exported JSON file
4. Entries added to history

**Use case:** Share successful request configurations with teammates

---

## Advanced Features

### Star/Favorite Entries

1. Hover over history entry
2. Click **⭐ Star** icon
3. Entry marked as favorite
4. Filter: **"Starred Only"** to view favorites

**Use case:** Keep important/reference requests easily accessible

### Add Notes to History

1. Right-click history entry
2. Select **"Add Note"**
3. Write description:
   ```
   "This request successfully created user ID 456.
   Token expires at 2024-03-15 2:30 PM."
   ```
4. Note saved with entry
5. Searchable in history

### Group by Collection

**View:** `Group by: Collection`

```
📁 User API
  ├── GET /users/123      (3 entries)
  ├── POST /users         (1 entry)
  └── DELETE /users/123   (2 entries)

📁 Order API
  ├── POST /orders        (5 entries)
  └── GET /orders/789     (2 entries)
```

---

## Integration with Other Features

### Collection Runner History

When you run a collection:
1. Each request execution saved to history
2. Tagged with collection run ID
3. Filter by run ID to see all requests from that run

**Example:**
```
Collection Run #42 (10 requests)
  ✅ 1. Create User         201 Created
  ✅ 2. Get User            200 OK
  ✅ 3. Update User         200 OK
  ❌ 4. Delete User         403 Forbidden
  ...
```

### Environment-Specific History

**Filter by environment:**
```
Environment: Production
Results: Only requests sent to Production environment
```

**Use case:** Audit production API calls separately from test calls

### Request History in Tabs

When working with multiple tabs:
- Each tab's history is tracked
- Switch tabs to see history of that specific request
- All histories merged in global History sidebar

---

## Best Practices

### ✅ DO:
- **Review history after errors**: Understand what was sent
- **Export important requests**: Save successful configurations
- **Star critical requests**: Quick access to important tests
- **Add notes for context**: Document why request succeeded/failed
- **Compare over time**: Track API behavior changes
- **Use for debugging**: Check exact headers/body sent
- **Clean old entries**: Keep history manageable

### ❌ DON'T:
- **Don't rely on history for sensitive data**: Export or save to environment instead
- **Don't ignore failed requests**: They often reveal API issues
- **Don't delete all history**: Keep some for reference
- **Don't confuse with versions**: History is executions, not saved request versions
- **Don't share production history**: May contain sensitive data

---

## Troubleshooting

### History Not Saving

**Check:**
1. Settings → Preferences → "Save request history" is enabled
2. Sufficient storage space available
3. No errors in Console tab

### Missing Response Bodies

**Cause:** "Save response bodies" disabled to save storage

**Solution:**
1. Settings → History → Enable "Save response bodies"
2. Re-run requests to capture bodies

### Can't Find Old Request

**Solutions:**
1. Expand date range filter
2. Check if auto-cleanup removed it (>30 days old)
3. Search by partial URL or method
4. Check if accidentally deleted

### History Growing Too Large

**Solutions:**
1. Lower "Max history entries" limit
2. Enable auto-cleanup (delete >30 days)
3. Manually delete old entries
4. Disable "Save response bodies" for lighter storage

---

## Related Topics

- [Request Builder](../core-concepts/requests.md) - Send requests that get saved to history
- [Response Viewer](../requests/rest/get-requests.md) - View responses from history
- [Collection Runner](collection-runner.md) - History tracks collection runs
- [Test Scripts](test-scripts.md) - Test results saved in history
- [Environments](../core-concepts/environments.md) - History tracks which environment was used
