# Workspaces

**Workspaces** are the top-level organizational unit in Simba. Think of a workspace as a project container that holds all your collections, environments, and team members for a specific API testing project.

## What is a Workspace?

A workspace provides isolated containers for:

- **Collections**: Groups of API requests
- **Environments**: Variable sets for different stages (Dev, Staging, Production)
- **Team Members**: Collaborators with specific permissions
- **History**: Request execution logs
- **Settings**: Workspace-specific configuration

![Workspace Structure](../assets/screenshots/workspace-structure.png)

## Why Use Workspaces?

### Isolation
Each workspace is completely isolated from others. Changes in one workspace don't affect another.

### Organization
Separate your work by:
- **Project**: One workspace per API project
- **Client**: One workspace per client
- **Environment**: Development vs. Production testing
- **Team**: Personal vs. team workspaces

### Collaboration
Invite team members to specific workspaces and control their access levels.

### Data Separation
Keep sensitive data (API keys, credentials) separate for different projects.

---

## Creating a Workspace

### From the UI

**Method 1: First Login**

When you first log in, Simba prompts you to create a workspace:

![Create Workspace on Login](../assets/screenshots/workspace-creation.png)

1. Enter **Workspace Name**: e.g., "My API Project"
2. Add **Description** (optional): e.g., "User management API testing"
3. Click **Create Workspace**

**Method 2: Workspace Switcher**

![Workspace Switcher](../assets/screenshots/workspace-switcher.png)

1. Click the **Workspace dropdown** (top left)
2. Select **+ Create New Workspace**
3. Fill in the form:
   - **Name**: Required, unique name
   - **Description**: Optional details about the workspace
4. Click **Create**

### Example Workspace Setup

```
🏢 User Management API
   Description: Testing endpoints for user CRUD operations
   Created: 2025-01-15
   Members: 3
   Collections: 5
   Environments: 3 (Dev, Staging, Prod)
```

---

## Switching Between Workspaces

You can work in multiple workspaces and switch between them easily.

![Switching Workspaces](../assets/screenshots/workspace-switcher.png)

**To switch workspaces:**

1. Click the **Workspace dropdown** (top left)
2. Select the workspace you want to open
3. Simba loads that workspace's collections and environments

!!! tip "Keyboard Shortcut"
    Press `Cmd/Ctrl + Shift + W` to open the workspace switcher quickly.

**When you switch workspaces:**
- ✅ All collections from the new workspace load
- ✅ Environments are switched
- ✅ Request tabs are closed (unsaved changes are lost)
- ✅ History is filtered to the new workspace

---

## Workspace Settings

Manage workspace configuration and metadata.

![Workspace Settings](../assets/screenshots/workspace-settings.png)

**To access settings:**

1. Click **Workspace dropdown**
2. Select **Workspace Settings**

### General Settings

**Name**
- Update workspace name
- Must be unique across your workspaces

**Description**
- Add or update workspace description
- Supports markdown formatting

**Created Date**
- Shows when workspace was created
- Read-only

**Owner**
- Shows who created the workspace
- Cannot be changed

### Advanced Settings

**Default Environment**
- Set which environment loads by default
- Options: None, or any created environment

**Auto-save Requests**
- Automatically save request changes
- Reduces risk of losing work

**Request Timeout**
- Default timeout for all requests in workspace
- Can be overridden per request
- Default: 30 seconds

---

## Workspace Members

Collaborate with team members by inviting them to your workspace.

![Workspace Members](../assets/screenshots/workspace-members.png)

### Adding Members

**To invite a team member:**

1. Go to **Workspace Settings**
2. Click the **Members** tab
3. Click **+ Invite Member**
4. Enter their **email address**
5. Select **permission level**:
   - **Viewer**: Read-only access
   - **Editor**: Can create/edit requests
   - **Admin**: Full control except deletion
6. Click **Send Invite**

The invited user receives an email and appears in your workspace when they accept.

### Permission Levels

| Permission | Viewer | Editor | Admin | Owner |
|------------|--------|--------|-------|-------|
| View collections | ✅ | ✅ | ✅ | ✅ |
| View environments | ✅ | ✅ | ✅ | ✅ |
| Execute requests | ✅ | ✅ | ✅ | ✅ |
| View history | ✅ | ✅ | ✅ | ✅ |
| Create/edit requests | ❌ | ✅ | ✅ | ✅ |
| Create/edit collections | ❌ | ✅ | ✅ | ✅ |
| Create/edit environments | ❌ | ✅ | ✅ | ✅ |
| Invite members | ❌ | ❌ | ✅ | ✅ |
| Remove members | ❌ | ❌ | ✅ | ✅ |
| Change permissions | ❌ | ❌ | ✅ | ✅ |
| Edit workspace settings | ❌ | ❌ | ✅ | ✅ |
| Delete workspace | ❌ | ❌ | ❌ | ✅ |

!!! warning "Permission Changes"
    Permission changes take effect immediately. Active sessions may need to refresh.

### Removing Members

**To remove a member:**

1. Go to **Workspace Settings** → **Members**
2. Find the member to remove
3. Click the **⋮** menu next to their name
4. Select **Remove from Workspace**
5. Confirm removal

!!! danger "Immediate Effect"
    Removed members immediately lose access to the workspace and all its contents.

---

## Workspace Organization Strategies

### Strategy 1: By Project

Create one workspace per API project:

```
🏢 E-commerce API
   ├─ User Service
   ├─ Product Service
   ├─ Order Service
   └─ Payment Service

🏢 Analytics Dashboard API
   ├─ Reports API
   ├─ Metrics API
   └─ Dashboard API
```

**Best for**: Multiple independent projects

### Strategy 2: By Client

Create one workspace per client:

```
🏢 Client A - Retail
   ├─ Production APIs
   ├─ Staging APIs
   └─ Internal Tools

🏢 Client B - Finance
   ├─ Core Banking API
   ├─ Mobile API
   └─ Web Portal API
```

**Best for**: Consultants, agencies, freelancers

### Strategy 3: By Environment

Create workspaces for different stages:

```
🏢 Development
   └─ All services (unstable)

🏢 Staging
   └─ All services (pre-release)

🏢 Production
   └─ All services (live)
```

**Best for**: Strict environment isolation

### Strategy 4: By Team

Create workspaces for different teams:

```
🏢 Backend Team
   ├─ Service 1
   ├─ Service 2
   └─ Database API

🏢 Frontend Team
   ├─ Web API Clients
   ├─ Mobile API Clients
   └─ Shared Components

🏢 QA Team
   ├─ Test Suites
   ├─ Regression Tests
   └─ Performance Tests
```

**Best for**: Large organizations

---

## Exporting and Importing Workspaces

### Exporting a Workspace

Export your workspace to share with others or backup.

**To export:**

1. Go to **Workspace Settings**
2. Click **Export** tab
3. Choose export format:
   - **Simba Format**: Full workspace with history
   - **Postman Format**: Compatible with Postman
4. Click **Export Workspace**
5. Save the JSON file

**Export includes**:
- ✅ All collections and folders
- ✅ All requests
- ✅ Environment variables
- ✅ Pre-request and test scripts
- ❌ Request history (optional)
- ❌ Workspace members (for security)

### Importing a Workspace

Import workspaces from Simba or migrate from Postman.

**To import:**

1. Click **Workspace dropdown**
2. Select **Import Workspace**
3. Choose source:
   - **Simba JSON**: From exported Simba workspace
   - **Postman Collection**: From Postman export
4. Select file to upload
5. Click **Import**

!!! tip "Merge or Replace"
    When importing, you can:
    - **Merge**: Add to existing workspace
    - **Create New**: Create a new workspace for imported data

---

## Deleting a Workspace

!!! danger "Permanent Action"
    Deleting a workspace is permanent and cannot be undone. All collections, requests, environments, and history will be lost.

**To delete a workspace:**

1. Go to **Workspace Settings**
2. Scroll to **Danger Zone**
3. Click **Delete Workspace**
4. Type the workspace name to confirm
5. Click **Delete Forever**

**What gets deleted:**
- All collections and folders
- All requests and history
- All environments and variables
- All member associations

**What's preserved:**
- User accounts (members can still access other workspaces)
- Exported backups (if you made them)

---

## Best Practices

### Naming Conventions

Use clear, descriptive names:

✅ **Good Examples**:
- "E-commerce Production API"
- "User Service - Development"
- "Client Portal APIs"

❌ **Bad Examples**:
- "Test"
- "My Workspace"
- "Workspace 1"

### Workspace Structure

Keep workspaces focused:

✅ **Do**:
- One workspace per project or client
- Include all related API collections
- Use consistent naming across workspaces

❌ **Don't**:
- Mix unrelated projects in one workspace
- Create too many workspaces for the same project
- Duplicate collections across workspaces

### Security

Protect sensitive data:

✅ **Do**:
- Use environment variables for secrets
- Limit member permissions appropriately
- Export backups regularly
- Review member list periodically

❌ **Don't**:
- Hardcode API keys in requests
- Give everyone admin access
- Share workspace exports publicly
- Keep removed employees as members

### Collaboration

Work effectively with your team:

✅ **Do**:
- Document workspace purpose in description
- Set default environment for consistency
- Communicate changes to team members
- Use collection-level scripts for shared logic

❌ **Don't**:
- Make breaking changes without notice
- Delete resources others are using
- Override shared environments
- Work in isolation without syncing

---

## Related Topics

<div class="grid cards" markdown>

-   :material-folder-multiple:{ .lg .middle } **Collections**

    ---

    Learn how to organize requests into collections

    [:octicons-arrow-right-24: Collections Guide](collections.md)

-   :material-earth:{ .lg .middle } **Environments**

    ---

    Manage environment variables for different stages

    [:octicons-arrow-right-24: Environments Guide](environments.md)

-   :material-account-group:{ .lg .middle } **Permissions**

    ---

    Understand workspace permissions and roles

    [:octicons-arrow-right-24: Permissions Guide](../collaboration/permissions.md)

-   :material-export:{ .lg .middle } **Import/Export**

    ---

    Share workspaces and migrate from other tools

    [:octicons-arrow-right-24: Import/Export Guide](../collaboration/import-export.md)

</div>

---

## Frequently Asked Questions

??? question "How many workspaces can I create?"
    There is no limit to the number of workspaces you can create. However, for better organization, we recommend creating workspaces only when needed.

??? question "Can I transfer workspace ownership?"
    Yes, as the owner, you can transfer ownership to another admin member in the workspace settings.

??? question "What happens if I leave a workspace?"
    If you're the owner, you must transfer ownership first. If you're a member, you'll lose access to the workspace and its contents.

??? question "Can I recover a deleted workspace?"
    No, workspace deletion is permanent. Always export a backup before deleting.

??? question "How do I rename a workspace?"
    Go to Workspace Settings → General → Edit Name → Save.

??? question "Can workspace members see each other?"
    Yes, all members can see the member list and their roles in Workspace Settings.

??? question "Are workspace environments shared?"
    Yes, environments are shared across all workspace members. Changes affect everyone.

??? question "Can I duplicate a workspace?"
    Export the workspace and import it as a new workspace with a different name.
