# Interface Tour

This guide walks you through the Simba interface, explaining each section and how to use it effectively.

## Main Interface Layout

![Simba Interface Overview](../assets/screenshots/interface-overview.png)
*The main Simba interface with labeled sections*

The Simba interface is divided into several key areas:

1. **Top Navigation Bar** - Workspace switcher, environment selector, user menu
2. **Sidebar** - Collection tree and navigation
3. **Request Builder** - Configure and send requests
4. **Response Viewer** - View and analyze responses
5. **Status Bar** - Request status, response time, and size

---

## 1. Top Navigation Bar

![Top Navigation Bar](../assets/screenshots/top-navigation-bar.png)

The top navigation bar provides quick access to essential features:

### Workspace Switcher
- **Location**: Top left corner
- **Purpose**: Switch between different workspaces
- **Usage**: Click to see all your workspaces, create new ones, or access workspace settings

```
🏢 My Workspace ▼
   ├─ My Workspace
   ├─ Team Project
   ├─ Personal APIs
   └─ + Create New Workspace
```

### Environment Selector
- **Location**: Top center
- **Purpose**: Switch between environments (Dev, Staging, Production)
- **Usage**: Select active environment to apply its variables to requests

```
🌍 Development ▼
   ├─ No Environment
   ├─ Development
   ├─ Staging
   ├─ Production
   └─ + Create Environment
```

### User Menu
- **Location**: Top right corner
- **Options**:
  - 👤 Profile Settings
  - 🔑 Change Password
  - 📊 Usage Statistics
  - 🚪 Logout

---

## 2. Sidebar: Collection Tree

![Collection Sidebar](../assets/screenshots/sidebar-navigation.png)

The sidebar organizes all your API requests in a tree structure.

### Sidebar Sections

#### Collections Tab
View and manage your collections:
- **Collections**: Top-level containers
- **Folders**: Group related requests
- **Requests**: Individual API endpoints

#### History Tab
Recent request executions with:
- Timestamp
- HTTP method and URL
- Status code
- Response time

#### Search Tab
Quickly find requests by:
- Name
- URL
- Method
- Tags

### Collection Tree Actions

=== "Collection Actions"
    Right-click a collection to:
    
    - ✏️ Rename Collection
    - 📁 Add Folder
    - 📄 Add Request
    - ⚙️ Collection Settings
    - ▶️ Run Collection
    - 📤 Export Collection
    - ❌ Delete Collection

=== "Folder Actions"
    Right-click a folder to:
    
    - ✏️ Rename Folder
    - 📁 Add Subfolder
    - 📄 Add Request
    - ▶️ Run Folder
    - 🔼 Move Up/Down
    - ❌ Delete Folder

=== "Request Actions"
    Right-click a request to:
    
    - ✏️ Rename Request
    - 📋 Duplicate Request
    - 🔼 Move Up/Down
    - 📁 Move to Folder
    - ❌ Delete Request

### Creating a Collection

1. Click **+ New** button in sidebar
2. Select **New Collection**
3. Enter collection name
4. (Optional) Add description
5. Click **Create**

![Create Collection Dialog](../assets/screenshots/collection-create-dialog.png)

---

## 3. Request Builder

The request builder is where you configure your API requests.

### URL Bar

![URL Bar](../assets/screenshots/url-bar-method-selector.png)

**Components**:
- **HTTP Method Dropdown**: GET, POST, PUT, PATCH, DELETE, etc.
- **URL Input**: Enter endpoint URL (supports `{{variables}}`)
- **Send Button**: Execute the request
- **Save Button**: Save request changes

**Example**:
```
GET  https://{{baseUrl}}/api/users/{{userId}}  [Send] [Save]
```

### Request Tabs

![Request Tabs](../assets/screenshots/request-tabs.png)

The request builder has multiple tabs for different configuration aspects:

#### Params Tab
![Query Parameters](../assets/screenshots/params-tab.png)

Add query parameters that append to the URL:

| Key | Value | Description |
|-----|-------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page |
| `sort` | `name` | Sort field |

**Resulting URL**: `https://api.example.com/users?page=1&limit=10&sort=name`

!!! tip "Variable Support"
    Use `{{variableName}}` in both keys and values to use environment variables.

#### Headers Tab
![HTTP Headers](../assets/screenshots/headers-tab.png)

Add HTTP headers to your request:

| Key | Value | Description |
|-----|-------|-------------|
| `Content-Type` | `application/json` | Request body format |
| `Authorization` | `Bearer {{token}}` | Auth token |
| `X-API-Key` | `{{apiKey}}` | API key |

**Common Headers**:
- `Accept`: Desired response format
- `User-Agent`: Client identification
- `Cache-Control`: Caching behavior
- `X-Custom-Header`: Custom business logic

#### Body Tab
![Request Body Editor](../assets/screenshots/body-tab-json.png)

Configure the request body (for POST, PUT, PATCH):

**Body Types**:

=== "JSON"
    ```json
    {
      "name": "{{userName}}",
      "email": "user@example.com",
      "role": "admin"
    }
    ```
    
    - Syntax highlighting
    - Auto-formatting with Ctrl/Cmd + Shift + F
    - Variable interpolation

=== "Form Data"
    ![Form Data Editor](../assets/screenshots/body-tab-form-data.png)
    
    | Key | Value | Type |
    |-----|-------|------|
    | `name` | `John Doe` | Text |
    | `avatar` | `[Choose File]` | File |
    | `age` | `30` | Text |

=== "Raw"
    ```xml
    <?xml version="1.0"?>
    <user>
      <name>{{userName}}</name>
      <email>user@example.com</email>
    </user>
    ```
    
    Supports: XML, HTML, Plain Text, JavaScript

=== "Binary"
    Upload a file directly as the request body
    
    - Click **Select File**
    - Choose file from disk
    - File sent as raw binary data

#### Auth Tab
![Authentication Configuration](../assets/screenshots/auth-tab-bearer.png)

Configure authentication for the request:

**Auth Types**:
- **Bearer Token**: JWT or API tokens
- **Basic Auth**: Username and password
- **API Key**: Custom key location and value
- **OAuth 2.0**: OAuth flow configuration
- **AWS Signature V4**: AWS service authentication
- **Digest Auth**: Challenge-response authentication
- **No Auth**: Inherit from collection or none

[Learn more about authentication →](../auth/overview.md)

#### Scripts Tab

**Pre-Request Script**:
![Pre-Request Script](../assets/screenshots/pre-request-script-editor.png)

JavaScript code executed **before** sending the request:

```javascript
// Generate timestamp
pm.environment.set('timestamp', Date.now());

// Set dynamic token
const token = pm.environment.get('refreshToken');
pm.environment.set('authToken', token);

// Log for debugging
console.log('Request will be sent to:', pm.request.url);
```

**Test Script**:
![Test Script](../assets/screenshots/test-script-editor.png)

JavaScript code executed **after** receiving the response:

```javascript
// Validate status code
pm.test("Status is 200", function() {
    pm.response.to.have.status(200);
});

// Validate response body
pm.test("Response has user data", function() {
    const data = pm.response.json();
    pm.expect(data).to.have.property('id');
    pm.expect(data.email).to.be.a('string');
});

// Extract data for next request
const userId = pm.response.json().id;
pm.environment.set('userId', userId);
```

[View complete scripting API →](../reference/scripting-api.md)

---

## 4. Response Viewer

After sending a request, the response appears in the bottom section.

### Response Tabs

![Response Viewer](../assets/screenshots/response-viewer-overview.png)

#### Body Tab
![Response Body](../assets/screenshots/response-body-json.png)

View the response body in different formats:

**View Options**:
- **Pretty**: Formatted JSON/XML with syntax highlighting
- **Raw**: Unformatted text
- **Preview**: Rendered HTML (for HTML responses)

**Features**:
- 🔍 Search within response
- 📋 Copy to clipboard
- 💾 Save to file
- 🔄 Auto-format

#### Headers Tab
![Response Headers](../assets/screenshots/response-headers.png)

View all response headers:

| Header | Value |
|--------|-------|
| `content-type` | `application/json; charset=utf-8` |
| `content-length` | `1234` |
| `cache-control` | `no-cache` |
| `x-ratelimit-remaining` | `99` |

#### Cookies Tab
View cookies set by the server:

| Name | Value | Domain | Path | Expires |
|------|-------|--------|------|---------|
| `session_id` | `abc123...` | `.example.com` | `/` | Session |
| `user_pref` | `theme=dark` | `.example.com` | `/` | 7 days |

#### Test Results Tab
![Test Results](../assets/screenshots/test-results-passing.png)

View test script execution results:

=== "Passing Tests"
    ✅ **Status is 200** (15ms)
    ✅ **Response has user data** (3ms)
    ✅ **Email format is valid** (2ms)
    
    **3/3 tests passed**

=== "Failing Tests"
    ❌ **Status is 200** (12ms)
    ```
    Expected: 200
    Actual: 404
    ```
    
    ✅ **Response has error message** (2ms)
    
    **1/2 tests passed**

#### Console Tab
![Console Output](../assets/screenshots/console-output.png)

View console logs from scripts:

```
[Pre-Request] Request URL: https://api.example.com/users
[Pre-Request] Timestamp: 1704398400000
[Test] Response time: 245ms
[Test] User ID extracted: 12345
```

---

## 5. Status Bar

![Response Status Bar](../assets/screenshots/response-status-bar.png)

The status bar shows request execution details:

**Left Side**:
- **Status Code**: `200 OK`, `404 Not Found`, etc.
- **Response Time**: `245ms`
- **Response Size**: `1.2 KB`

**Right Side**:
- **Request History**: Jump to previous requests
- **Environment**: Current active environment
- **Save Status**: Auto-save indicator

---

## Keyboard Shortcuts

Work faster with these shortcuts:

### Global Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Send Request | `Cmd + Enter` | `Ctrl + Enter` |
| Save Request | `Cmd + S` | `Ctrl + S` |
| New Request | `Cmd + N` | `Ctrl + N` |
| Search Collections | `Cmd + P` | `Ctrl + P` |
| Toggle Sidebar | `Cmd + B` | `Ctrl + B` |

### Editor Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Format JSON | `Cmd + Shift + F` | `Ctrl + Shift + F` |
| Find in Editor | `Cmd + F` | `Ctrl + F` |
| Replace in Editor | `Cmd + H` | `Ctrl + H` |
| Toggle Comment | `Cmd + /` | `Ctrl + /` |

[View all keyboard shortcuts →](../reference/keyboard-shortcuts.md)

---

## Customization

### Theme Options
- **Light Mode**: Default bright theme
- **Dark Mode**: Eye-friendly dark theme
- **Auto**: Follows system preference

**To change theme**:
1. Click user menu (top right)
2. Select **Settings**
3. Choose **Appearance**
4. Select theme

### Layout Options
- **Sidebar Position**: Left (default) or Right
- **Response Panel**: Bottom (default) or Right
- **Font Size**: Small, Medium, Large
- **Font Family**: Monospace fonts for code

---

## Next Steps

Now that you know your way around the interface:

<div class="grid cards" markdown>

-   :material-api:{ .lg .middle } **Send Your First Request**

    ---

    Learn how to send a GET request and view the response

    [:octicons-arrow-right-24: First Request Tutorial](first-request.md)

-   :material-folder:{ .lg .middle } **Understand Collections**

    ---

    Learn how to organize requests into collections

    [:octicons-arrow-right-24: Collections Guide](../concepts/collections.md)

-   :material-code-braces:{ .lg .middle } **Use Variables**

    ---

    Learn how to use environment and collection variables

    [:octicons-arrow-right-24: Variables Guide](../concepts/variables.md)

</div>
