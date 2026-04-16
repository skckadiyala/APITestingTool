# Your First Request

Learn how to make your first API request in Simba in under 5 minutes.

---

## Step 1: Login

1. Open Simba at `http://localhost:5174`
2. Login with your credentials or create a new account

![Login Screen](../assets/screenshots/login.png)
*Placeholder: Screenshot of login page*

---

## Step 2: Create a Workspace

Workspaces organize your API testing projects.

1. Click "**+ New Workspace**" in the sidebar
2. Enter workspace details:
   - **Name**: My First Workspace
   - **Description**: Learning Simba basics

![Create Workspace](../assets/screenshots/create-workspace.png)
*Placeholder: Screenshot showing workspace creation dialog*

---

## Step 3: Create a Collection

Collections group related requests together.

1. Right-click your workspace → "**New Collection**"
2. Name it: "**Getting Started**"

![Create Collection](../assets/screenshots/create-collection.png)
*Placeholder: Screenshot showing collection creation*

---

## Step 4: Create Your First Request

Let's make a simple GET request to a public API.

1. Right-click your collection → "**New Request**"
2. Configure the request:

### Request Details

```
Method: GET
URL: https://jsonplaceholder.typicode.com/users/1
Name: Get User
```

![Request Builder](../assets/screenshots/request-builder.png)
*Placeholder: Screenshot of request builder interface*

### Step-by-Step

=== \"URL Bar\"
    1. Select **GET** from the method dropdown
    2. Enter URL: `https://jsonplaceholder.typicode.com/users/1`
    3. Name your request: "Get User"

=== \"Headers (Optional)\"
    Headers are auto-added, but you can add custom ones:
    ```
    Key: Accept
    Value: application/json
    ```

=== \"Send Request\"
    Click the blue "**Send**" button

---

## Step 5: View the Response

After clicking Send, you'll see the response:

### Response Details

=== \"Body\"
    ```json
    {
      \"id\": 1,
      \"name\": \"Leanne Graham\",
      \"username\": \"Bret\",
      \"email\": \"Sincere@april.biz\",
      \"address\": {
        \"street\": \"Kulas Light\",
        \"suite\": \"Apt. 556\",
        \"city\": \"Gwenborough\",
        \"zipcode\": \"92998-3874\"
      },
      \"phone\": \"1-770-736-8031 x56442\",
      \"website\": \"hildegard.org\"
    }
    ```

=== \"Headers\"
    ```
    content-type: application/json; charset=utf-8
    status: 200
    ```

=== \"Status\"
    - **Status Code**: 200 OK
    - **Response Time**: ~150ms
    - **Size**: 500 bytes

![Response Viewer](../assets/screenshots/response-viewer.png)
*Placeholder: Screenshot showing the response viewer

*

---

## Step 6: Save Your Request

1. Click the "**Save**" button in the top-right
2. Your request is now saved in the collection

!!! tip \"Keyboard Shortcut\"
    Use **Ctrl+S** (or **⌘+S** on Mac) to quickly save requests

---

## Step 7: Add a Test Script (Optional)

Let's verify the response with a test:

1. Click the "**Tests**" tab
2. Add this JavaScript code:

```javascript
// Test that status is 200
pm.test(\"Status is 200\", function() {
    pm.response.to.have.status(200);
});

// Test that response has user data
pm.test(\"Response has user name\", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData.name).to.exist;
    pm.expect(jsonData.name).to.equal(\"Leanne Graham\");
});

// Test response time
pm.test(\"Response time is less than 500ms\", function() {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

3. Click "**Send**" again
4. Check the "**Test Results**" section

![Test Results](../assets/screenshots/test-results.png)
*Placeholder: Screenshot showing passing tests*

---

## Step 8: Try a POST Request

Let's create a new user (simulated):

1. Create a new request: "**Create User**"
2. Configure:

```
Method: POST
URL: https://jsonplaceholder.typicode.com/users
```

3. Go to "**Body**" tab → Select "**JSON**"
4. Add request body:

```json
{
  \"name\": \"John Doe\",
  \"username\": \"johndoe\",
  \"email\": \"john@example.com\"
}
```

5. Click "**Send**"

Expected response:
```json
{
  \"id\": 11,
  \"name\": \"John Doe\",
  \"username\": \"johndoe\",
  \"email\": \"john@example.com\"
}
```

---

## Common First-Time Questions

??? question \"Why is my request failing?\"
    Check:
    - ✅ URL is correct (include `https://`)
    - ✅ Internet connection is active
    - ✅ Server is reachable
    - ✅ CORS is configured (for local APIs)

??? question \"How do I save requests?\"
    Click the **Save** button or use **Ctrl+S**. Requests must be in a collection to be saved.

??? question \"Can I organize requests in folders?\"
    Yes! Right-click collection → **New Folder**, then drag requests into folders.

??? question \"Where is my request history?\"
    Click the **History** tab in the sidebar to see all recent requests.

---

## What You've Learned

✅ Created a workspace and collection  
✅ Made a GET request  
✅ Viewed and understood responses  
✅ Added test scripts  
✅ Made a POST request with body  

---

## Next Steps

Now that you've made your first request, explore:

1. [**Interface Tour**](interface-tour.md) - Understand all UI elements
2. [**Environment Variables**](../concepts/environments.md) - Use variables in requests
3. [**Authentication**](../auth/overview.md) - Add auth to requests
4. [**GraphQL**](../requests/graphql/overview.md) - Test GraphQL APIs

[Interface Tour →](interface-tour.md){ .md-button .md-button--primary }
[Core Concepts →](../concepts/workspaces.md){ .md-button }
