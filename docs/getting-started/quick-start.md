# Quick Start Guide

Get up and running with Simba in 5 minutes! This guide covers the essential steps to start testing APIs.

## Prerequisites

Before you begin, ensure:

- ✅ Simba is installed and running ([Installation Guide](installation.md))
- ✅ You can access Simba at `http://localhost:5173`
- ✅ Backend server is running on `http://localhost:5000`

---

## Step 1: Create an Account

![Sign Up Screen](../assets/screenshots/signup-screen.png)

1. Open Simba in your browser: `http://localhost:5173`
2. Click **Sign Up**
3. Enter your details:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: Strong password (8+ characters)
4. Click **Create Account**
5. You'll be automatically logged in

!!! tip "Quick Login"
    If you already have an account, click **Login** and enter your credentials.

---

## Step 2: Create Your First Workspace

![Create Workspace](../assets/screenshots/workspace-creation.png)

Workspaces organize your API testing projects.

**To create a workspace:**

1. You'll see the **Create Workspace** dialog on first login
2. Enter workspace details:
   - **Name**: e.g., "My API Project"
   - **Description**: e.g., "Testing the Users API"
3. Click **Create Workspace**

Your new workspace is now active and ready to use!

---

## Step 3: Create a Collection

![Create Collection](../assets/screenshots/collection-create-dialog.png)

Collections group related API requests together.

**To create a collection:**

1. Click **+ New** in the sidebar
2. Select **New Collection**
3. Enter collection details:
   - **Name**: e.g., "Users API"
   - **Description**: "User management endpoints"
4. Click **Create**

Your collection appears in the sidebar!

---

## Step 4: Create Your First Request

![Create Request](../assets/screenshots/request-create-dialog.png)

**To create a request:**

1. Right-click your collection in the sidebar
2. Select **Add Request**
3. Enter request details:
   - **Name**: e.g., "Get All Users"
   - **Method**: GET
   - **URL**: `https://jsonplaceholder.typicode.com/users`
4. Click **Create**

The request builder opens automatically.

---

## Step 5: Send the Request

![Request Builder](../assets/screenshots/request-builder-get-method.png)

**To send your first API request:**

1. Verify the URL is correct: `https://jsonplaceholder.typicode.com/users`
2. Method should be **GET**
3. Click the **Send** button (or press `Cmd/Ctrl + Enter`)

**That's it!** You've sent your first API request.

---

## Step 6: View the Response

![Response Viewer](../assets/screenshots/response-viewer-json-body.png)

After sending, the response appears below:

**Response Details**:
- **Status**: `200 OK` ✅
- **Time**: Response time in milliseconds
- **Size**: Response size in KB

**Response Body**:
```json
[
  {
    "id": 1,
    "name": "Leanne Graham",
    "username": "Bret",
    "email": "Sincere@april.biz",
    "address": {
      "street": "Kulas Light",
      "city": "Gwenborough"
    }
  }
  // ... more users
]
```

**Response Tabs**:
- **Body**: View the response data (JSON, XML, HTML)
- **Headers**: See response headers
- **Cookies**: View set cookies
- **Test Results**: See test outcomes (if you have tests)

---

## Step 7: Add a Test Script

![Test Script](../assets/screenshots/test-script-editor.png)

Let's add a simple test to validate the response.

**To add a test:**

1. Click the **Scripts** tab in the request builder
2. Select **Test Script** (post-response)
3. Add this code:

```javascript
// Test 1: Verify status code
pm.test("Status code is 200", function() {
    pm.response.to.have.status(200);
});

// Test 2: Verify response is an array
pm.test("Response is an array", function() {
    const users = pm.response.json();
    pm.expect(users).to.be.an('array');
});

// Test 3: Verify array has users
pm.test("Response has users", function() {
    const users = pm.response.json();
    pm.expect(users.length).to.be.above(0);
});

// Test 4: User has required fields
pm.test("User has required fields", function() {
    const user = pm.response.json()[0];
    pm.expect(user).to.have.property('id');
    pm.expect(user).to.have.property('name');
    pm.expect(user).to.have.property('email');
});
```

4. Click **Send** again to run the tests

![Test Results Passing](../assets/screenshots/test-results-passing.png)

**Result**: All 4 tests pass! ✅

---

## Step 8: Create a POST Request

Let's create a more complex request that sends data.

![Create POST Request](../assets/screenshots/request-create-dialog.png)

**To create a POST request:**

1. Right-click your collection
2. Select **Add Request**
3. Enter details:
   - **Name**: "Create User"
   - **Method**: POST
   - **URL**: `https://jsonplaceholder.typicode.com/users`
4. Click **Create**

### Configure the POST Request

![POST Request Body](../assets/screenshots/body-tab-json.png)

**1. Add Headers:**
- Go to **Headers** tab
- Add header:
  - Key: `Content-Type`
  - Value: `application/json`

**2. Add Request Body:**
- Go to **Body** tab
- Select **JSON** format
- Add this JSON:

```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "phone": "1-555-123-4567",
  "website": "johndoe.com"
}
```

**3. Add Test:**
- Go to **Scripts** tab
- Add this test:

```javascript
pm.test("User created successfully", function() {
    pm.response.to.have.status(201);
});

pm.test("Response has ID", function() {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
});
```

**4. Send the Request:**
- Click **Send**

**Response**:
```json
{
  "id": 11,
  "name": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "phone": "1-555-123-4567",
  "website": "johndoe.com"
}
```

✅ Status: `201 Created`
✅ Tests: 2/2 passed

---

## Step 9: Use Environment Variables

![Environment Selector](../assets/screenshots/environment-selector.png)

Environment variables help manage different environments (Dev, Staging, Production).

### Create an Environment

**To create an environment:**

1. Click the **Environment dropdown** (top center)
2. Select **+ Create Environment**
3. Enter environment name: "Development"
4. Add variables:

| Variable | Value |
|----------|-------|
| `baseUrl` | `https://jsonplaceholder.typicode.com` |
| `apiKey` | `your-dev-api-key` |

5. Click **Save**
6. Set as **Active Environment**

### Use Variables in Requests

![Variable Syntax](../assets/screenshots/variable-syntax-example.png)

**Update your request URL:**

Before:
```
https://jsonplaceholder.typicode.com/users
```

After:
```
{{baseUrl}}/users
```

**Benefits**:
- ✅ Switch environments easily
- ✅ Share collections without hardcoded URLs
- ✅ Manage sensitive data (API keys)

---

## Step 10: View Request History

![Request History](../assets/screenshots/request-history-panel.png)

Every request you send is saved to history.

**To view history:**

1. Click **History** tab in sidebar
2. See all previous requests with:
   - Timestamp
   - Method and URL
   - Status code
   - Response time
3. Click any entry to re-execute it

**History is useful for**:
- 🔄 Re-running previous requests
- 🐛 Debugging API issues
- 📊 Comparing responses over time
- 📝 Auditing API usage

---

## Next Steps: Master Simba

Congratulations! You've learned the basics. Here's what to explore next:

<div class="grid cards" markdown>

-   :material-book-open:{ .lg .middle } **Core Concepts**

    ---

    Understand workspaces, collections, environments, and variables

    [:octicons-arrow-right-24: Learn Core Concepts](../concepts/workspaces.md)

-   :material-shield-key:{ .lg .middle } **Authentication**

    ---

    Learn how to authenticate API requests with Bearer tokens, OAuth2, and more

    [:octicons-arrow-right-24: Authentication Guide](../auth/overview.md)

-   :material-code-braces:{ .lg .middle } **Advanced Scripting**

    ---

    Master pre-request and test scripts with the pm API

    [:octicons-arrow-right-24: Scripting API Reference](../reference/scripting-api.md)

-   :material-run-fast:{ .lg .middle } **Collection Runner**

    ---

    Run entire collections and folders for automated testing

    [:octicons-arrow-right-24: Collection Runner Guide](../advanced/collection-runner.md)

-   :material-graphql:{ .lg .middle } **GraphQL Testing**

    ---

    Test GraphQL APIs with queries, mutations, and introspection

    [:octicons-arrow-right-24: GraphQL Guide](../requests/graphql/overview.md)

-   :material-school:{ .lg .middle } **Complete Tutorials**

    ---

    Follow step-by-step tutorials for common use cases

    [:octicons-arrow-right-24: View Tutorials](../tutorials/rest-api-testing.md)

</div>

---

## Common Issues

### Can't Access Simba

**Problem**: Browser shows "Cannot connect" error

**Solutions**:
1. Verify servers are running:
   ```bash
   # Backend should show: Server listening on port 5000
   # Frontend should show: Local: http://localhost:5173
   ```
2. Check firewall settings
3. Try a different browser

### Request Fails with CORS Error

**Problem**: Console shows CORS error

**Solutions**:
1. Verify backend `FRONTEND_URL` in `.env` matches your frontend URL
2. Check API server allows your origin
3. Use backend proxy for third-party APIs

### Tests Not Running

**Problem**: Test results tab shows "No tests run"

**Solutions**:
1. Verify test script uses `pm.test()` function
2. Check for syntax errors in script
3. Look at Console tab for error messages

---

## Tips for Success

!!! tip "Save Frequently"
    Click **Save** (Cmd/Ctrl + S) after making changes to requests.

!!! tip "Use Collections"
    Group related requests into collections and folders for better organization.

!!! tip "Name Requests Descriptively"
    Use clear names like "Get User by ID" instead of "Request 1".

!!! tip "Add Descriptions"
    Document what each request does in the description field.

!!! tip "Leverage Variables"
    Use `{{variables}}` for anything that changes between environments.

!!! tip "Write Tests Early"
    Add test scripts as you build requests to catch issues immediately.

---

## Getting Help

Need more help?

- 📖 **[Full Documentation](../index.md)** - Complete guides and references
- 🐛 **[GitHub Issues](https://github.com/skckadiyala/APITestingTool/issues)** - Report bugs
- 📧 **Email Support** - support@cdw.com
- ❓ **[FAQ](../reference/faq.md)** - Common questions

Happy API testing! 🚀
