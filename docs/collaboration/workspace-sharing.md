# Workspace Sharing

Workspaces in Simba allow teams to collaborate on API testing by sharing collections, environments, and requests. Invite team members and control their access with role-based permissions.

---

## Overview

**What is Workspace Sharing?**

Workspaces are shared containers that hold:
- **Collections**: Folders and requests organized by project
- **Environments**: Variable sets for different deployment stages
- **Request History**: Team's API execution logs
- **Data Files**: CSV/JSON files for data-driven testing

**Use cases:**
- **Team collaboration**: Multiple developers testing same API
- **QA activities**: Testers validate functionality
- **API documentation**: Share working examples with stakeholders
- **Knowledge sharing**: Onboard new team members with ready-to-use collections
- **Cross-functional work**: Backend, frontend, QA collaborate on single source of truth

---

## Understanding Workspaces

### Personal vs. Shared Workspaces

**Personal Workspace:**
- Created automatically for each user
- Private by default (only you can see)
- Perfect for personal testing, experiments
- Can be shared by inviting members

**Shared Workspace:**
- Explicitly created for team collaboration
- Has multiple members with different roles
- Owner controls access and permissions
-All changes visible to team members with appropriate access

---

## Creating and Managing Workspaces

### Create New Workspace

![Create Workspace](../assets/screenshots/workspace-create.png)

1. Click **Workspaces dropdown** in top-left
2. Click **"+ New Workspace"**
3. Enter details:
   - **Name**: `Backend API Team` (descriptive, clear)
   - **Description**: `Shared collections for backend microservices testing`
   - **Settings**: SSL verification, proxy configuration (optional)
4. Click **"Create"**
5. Workspace created with you as **OWNER**

### Switch Between Workspaces

![Workspace Switcher](../assets/screenshots/workspace-switcher.png)

1. Click workspace name in top-left
2. Select from dropdown:
   ```
   My Workspace (Personal)
   Backend API Team (Shared)
   Frontend Testing (Shared)
   QA Automation (Shared)
   ```
3. All collections, environments change to selected workspace

### Edit Workspace Settings

1. Click workspace name → **"Workspace Settings"**
2. Modify:
   - Name and description
   - SSL certificate validation
   - Proxy settings
   - Default environment
3. Click **"Save Changes"**

**Note:** Only **OWNER** role can edit workspace settings

---

## Inviting Team Members

### Send Invitation

![Invite Member](../assets/screenshots/workspace-invite.png)

1. Open workspace you want to share
2. Click **workspace name** → **"Manage Members"**
3. Click **"+ Invite Member"**
4. Enter team member's **email address**
5. Select **role**: OWNER, EDITOR, or VIEWER (see Permissions page)
6. Optionally add message:
   ```
   "Welcome to the team! This workspace contains our backend API tests."
   ```
7. Click **"Send Invitation"**
8. Invitation email sent to recipient

### Accept Invitation (Recipient)

1. Recipient receives email: **"You've been invited to join [Workspace Name]"**
2. Click **"Accept Invitation"** link in email
3. If no Simba account:
   - Redirected to Sign Up page
   - Create account
   - Automatically added to workspace after sign up
4. If existing account:
   - Login
   - Added to workspace immediately
5. Workspace appears in workspace dropdown

### Pending Invitations

**View pending invitations:**
```
Workspace Settings → Members tab

Pending Invitations:
  john@example.com      EDITOR    Sent: 2024-03-14  [Resend] [Cancel]
  jane@example.com      VIEWER    Sent: 2024-03-12  [Resend] [Cancel]
```

**Actions:**
- **Resend**: Send invitation email again
- **Cancel**: Revoke invitation (link becomes invalid)

---

## Managing Members

### View Current Members

![Members List](../assets/screenshots/workspace-members.png)

```
Workspace: Backend API Team
Members: 5

Owner:
  Alice Johnson (alice@company.com)      OWNER      Joined: 2024-01-10

Editors:
  Bob Smith (bob@company.com)            EDITOR     Joined: 2024-01-15
  Carol White (carol@company.com)        EDITOR     Joined: 2024-02-01

Viewers:
  Dan Brown (dan@company.com)            VIEWER     Joined: 2024-02-20
  Eve Green (eve@company.com)            VIEWER     Joined: 2024-03-01
```

### Change Member Role

1. Go to **Workspace Settings** → **Members**
2. Find member in list
3. Click **role dropdown** next to their name
4. Select new role: OWNER, EDITOR, VIEWER
5. Confirm change
6. Member's permissions updated immediately

**Note:** Only **OWNER** can change roles

### Remove Member

1. Go to **Workspace Settings** → **Members**
2. Find member in list
3. Click **"Remove"** button (🗑️ icon)
4. Confirm: **"Are you sure you want to remove [Name] from this workspace?"**
5. Click **"Remove"**
6. Member loses access immediately
7. Workspace no longer appears in their workspace list

**Note:** Only **OWNER** can remove members

---

## Collaboration Workflows

### Workflow 1: Team API Development

**Scenario:** Backend team developing new API

**Setup:**
```
Workspace: Payment API Development
Members:
  - Sarah (OWNER) - Tech Lead
  - Mark (EDITOR) - Backend Developer
  - Lisa (EDITOR) - QA Engineer
  - Tom (VIEWER) - Frontend Developer
```

**Workflow:**
1. **Sarah** creates workspace and base collections
2. **Mark** adds new endpoints as he develops them
3. **Lisa** adds comprehensive test scripts
4. **Tom** views collections to understand API contracts (read-only)
5. All changes synced in real-time

### Workflow 2: QA Testing Team

**Scenario:** QA team testing staging environment

**Setup:**
```
Workspace: QA Staging Tests
Members:
  - QA Manager (OWNER)
  - 3 QA Engineers (EDITOR)
  - Product Manager (VIEWER)
```

**Workflow:**
1. QA Manager sets up environments (Dev, Staging, Prod)
2. QA Engineers create test collections
3. QA Engineers run collections, share results
4. Product Manager reviews test coverage (read-only)

### Workflow 3: API Documentation

**Scenario:** Sharing working API examples with stakeholders

**Setup:**
```
Workspace: Customer API Examples
Members:
  - API Team (OWNER/EDITOR) - Maintain examples
  - Customers (VIEWER) - View example requests
```

**Workflow:**
1. API team creates collections with example requests
2. Add descriptions and comments to requests
3. Invite customers as VIEWER
4. Customers can load examples, modify locally, but not change shared version

---

## Real-Time Collaboration Features

### Live Updates

When a team member makes changes, you see updates in real-time:

```
✨ Bob Smith created collection "Order Management"
✨ Carol White added request "Create Order"
✨ Dan Brown updated environment "Staging" variables
```

### Activity Feed

![Activity Feed](../assets/screenshots/workspace-activity.png)

View workspace activity:
```
Workspace Settings → Activity tab

Today:
  10:30 AM  Bob Smith       Created request "Get User"
  9:45 AM   Carol White     Updated collection "Users"
  9:00 AM   Alice Johnson   Added member "eve@company.com"

Yesterday:
  5:15 PM   Bob Smith       Ran collection "Smoke Tests"
  2:30 PM   Carol White     Created environment "Production"
```

### Conflict Resolution

**Simultaneous edits:**
```
You: Editing request "Create User"
Carol: Also editing request "Create User"

Notification: "Carol is also editing this request"
```

**Last save wins:**
- Simba shows warning if multiple people edit same request
- Last person to save overwrites previous changes
- No automatic merging (like Git)

**Best practice:**
- Communicate with team before editing shared requests
- Use comments to indicate work in progress
- Consider creating duplicate for experimentation

---

## Workspace Organization Best Practices

### Strategy 1: Workspace per Project

```
My Workspaces:
  📁 Mobile App API (iOS/Android team)
  📁 Web Dashboard API (Web team)
  📁 Admin Portal API (Admin team)
  📁 Public API (External developers)
```

**Pros:** Clear separation, focused collaboration  
**Cons:** More workspaces to manage

### Strategy 2: Workspace per Environment

```
My Workspaces:
  📁 Development (All Dev testing)
  📁 Staging (Pre-prod validation)
  📁 Production (Prod monitoring)
```

**Pros:** Clear environment separation  
**Cons:** Duplicate collections across workspaces

### Strategy 3: Workspace per Team

```
My Workspaces:
  📁 Engineering Team (Dev + QA)
  📁 Product Team (PMs + Stakeholders)
  📁 Customer Success (Support team)
```

**Pros:** Aligned with org structure  
**Cons:** May need cross-team access

### Recommended Structure

**Recommended:**
```
📁 Backend API - Development
  ├── Collections: Auth, Users, Orders, etc.
  ├── Environments: Local, Dev
  └── Members: Dev team (EDITOR), QA (EDITOR)

📁 Backend API - Staging
  ├── Collections: Same as Dev
  ├── Environments: Staging
  └── Members: QA (EDITOR), Product (VIEWER)

📁 Backend API - Production
  ├── Collections: Read-only monitoring
  ├── Environments: Prod (limited members)
  └── Members: SRE team only (VIEWER primarily)
```

---

## Security and Permissions

### Access Control

Members can only access what their role permits:

| Action | OWNER | EDITOR | VIEWER |
|--------|-------|--------|--------|
| View collections | ✅ | ✅ | ✅ |
| View environments | ✅ | ✅ | ✅ |
| View history | ✅ | ✅ | ✅ |
| Create/edit collections | ✅ | ✅ | ❌ |
| Create/edit environments | ✅ | ✅ | ❌ |
| Send requests | ✅ | ✅ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |

**See [Permissions](permissions.md) for detailed role breakdown.**

### Sensitive Data Protection

**Best practices:**
- Store sensitive values in environment variables (not visible in UI by default)
- Use separate workspaces for different security levels
- Grant VIEWER role to external stakeholders
- Regularly audit workspace members (remove inactive users)
- Use production workspaces sparingly (read-only monitoring only)

### Audit Trail

All workspace actions are logged:
```
Audit Log (Admin only):
  2024-03-15 10:30  Bob added to workspace as EDITOR
  2024-03-14 16:45  Carol created collection "Orders"
  2024-03-14 09:00  Dan sent 50 requests to Production
  2024-03-13 14:20  Eve's role changed from EDITOR to VIEWER
```

---

## Leaving a Workspace

### As a Member (Non-Owner)

1. Go to **Workspace Settings** → **Members**
2. Find yourself in members list
3. Click **"Leave Workspace"**
4. Confirm: **"You will lose access to all collections and environments"**
5. Workspace removed from your list

### As the Owner

**Cannot leave** if you're the only OWNER:
```
Error: "You cannot leave this workspace because you are the only owner.
       Transfer ownership or delete the workspace."
```

**To leave:**
1. Promote another member to OWNER
2. Then click **"Leave Workspace"**

---

## Deleting a Workspace

**⚠️ Warning:** Deleting a workspace is **permanent** and cannot be undone.

### Delete Workspace

1. **Workspace Settings** → **Danger Zone**
2. Click **"Delete Workspace"**
3. Confirm by typing workspace name: `Backend API Team`
4. Click **"Delete Permanently"**
5. Workspace and ALL its data deleted:
   - Collections
   - Environments
   - Request history
   - Data files
   - Member associations

**Note:** Only **OWNER** can delete workspace

### Before Deleting

**Backup your data:**
1. Export all collections (see [Import/Export](import-export.md))
2. Export environments
3. Download data files
4. Take screenshots of important configurations

---

## Troubleshooting

### Invitation Not Received

**Solutions:**
1. Check spam/junk folder
2. Verify correct email address
3. Resend invitation from workspace settings
4. Contact workspace owner to confirm invitation sent

### Can't Edit Collection (VIEWER Role)

**Cause:** VIEWER role is read-only

**Solutions:**
1. Request workspace owner to change your role to EDITOR
2. Copy collection to your personal workspace (changes won't sync)

### Changes Not Syncing

**Solutions:**
1. Refresh Simba application
2. Check internet connection
3. Verify you have EDITOR role (not VIEWER)
4. Check if another member is editing simultaneously

### Member Not Showing in Workspace

**Solutions:**
1. Member must accept invitation first
2. Check pending invitations list
3. Resend invitation if expired
4. Verify member logged into correct Simba account

---

## Related Topics

- [Permissions](permissions.md) - Detailed role-based access control
- [Workspaces](../core-concepts/workspaces.md) - Core workspace concepts
- [Environments](../core-concepts/environments.md) - Share environment configurations
- [Collections](../core-concepts/collections.md) - Organize shared requests
- [Import/Export](import-export.md) - Backup and share collections
