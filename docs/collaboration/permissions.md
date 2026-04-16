# Permissions and Roles

Simba uses role-based access control (RBAC) to manage what team members can do in a shared workspace. Understand the three roles and their capabilities.

---

## Overview

**What are Workspace Roles?**

Roles control access to workspace resources:
- **Collections**: Create, edit, delete requests and folders
- **Environments**: Manage environment variables
- **Members**: Invite, remove, change roles
- **Settings**: Configure workspace preferences
- **Request Execution**: Send API requests

**Three roles:**
1. **OWNER** - Full control (admin privileges)
2. **EDITOR** - Can modify content
3. **VIEWER** - Read-only access

---

## Role Comparison

### Permission Matrix

| Permission | OWNER | EDITOR | VIEWER |
|-----------|-------|--------|--------|
| **Collections** |
| View collections | ✅ | ✅ | ✅ |
| Create collection | ✅ | ✅ | ❌ |
| Edit collection | ✅ | ✅ | ❌ |
| Delete collection | ✅ | ✅ | ❌ |
| Create folder | ✅ | ✅ | ❌ |
| Edit folder | ✅ | ✅ | ❌ |
| Delete folder | ✅ | ✅ | ❌ |
| Create request | ✅ | ✅ | ❌ |
| Edit request | ✅ | ✅ | ❌ |
| Delete request | ✅ | ✅ | ❌ |
| **Requests** |
| Send requests | ✅ | ✅ | ❌ |
| View request history | ✅ | ✅ | ✅ |
| Re-run from history | ✅ | ✅ | ❌ |
| Clear history | ✅ | ✅ | ❌ |
| **Environments** |
| View environments | ✅ | ✅ | ✅ |
| Create environment | ✅ | ✅ | ❌ |
| Edit environment | ✅ | ✅ | ❌ |
| Delete environment | ✅ | ✅ | ❌ |
| View secret values | ✅ | ✅ | ❌ |
| **Scripts & Testing** |
| Add pre-request scripts | ✅ | ✅ | ❌ |
| Add test scripts | ✅ | ✅ | ❌ |
| Run collection runner | ✅ | ✅ | ❌ |
| Upload data files | ✅ | ✅ | ❌ |
| **Workspace Management** |
| View members | ✅ | ✅ | ✅ |
| Invite members | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Edit workspace settings | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |
| Leave workspace | ✅ * | ✅ | ✅ |

*OWNER can only leave if another OWNER exists

---

## Role Details

### OWNER

**Who should be OWNER:**
- Workspace creator (default)
- Team leads
- Project managers
- Anyone who needs full administrative control

**Capabilities:**

**Full collection management:**
```javascript
✅ Create/edit/delete collections
✅ Organize folders and requests
✅ Manage collection variables and scripts
```

**Request execution:**
```javascript
✅ Send any request
✅ View and manage request history
✅ Run collection runner
✅ Upload data files for data-driven testing
```

**Environment management:**
```javascript
✅ Create/edit/delete environments
✅ Manage all variables (including secrets)
✅ Switch active environment
```

**Team administration:**
```javascript
✅ Invite new members
✅ Change member roles (OWNER ↔ EDITOR ↔ VIEWER)
✅ Remove members from workspace
✅ View pending invitations
```

**Workspace control:**
```javascript
✅ Edit workspace name and description
✅ Configure workspace settings (SSL, proxy)
✅ Delete workspace (permanent)
✅ Transfer ownership to another member
```

**Use cases:**
- **Tech Lead**: "I create the workspace, set up base collections, manage team access"
- **Project Manager**: "I need visibility into who has access and control over workspace lifecycle"
- **DevOps Lead**: "I manage production workspace access and enforce security policies"

---

### EDITOR

**Who should be EDITOR:**
- Developers
- QA engineers
- API testers
- Anyone who needs to create and modify requests

**Capabilities:**

**Full collection management:**
```javascript
✅ Create/edit/delete collections
✅ Create/edit/delete folders
✅ Create/edit/delete requests
✅ Add collection-level scripts and variables
```

**Request execution:**
```javascript
✅ Send any request
✅ View request history
✅ Re-run requests from history
✅ Run collection runner
✅ Upload data files
```

**Environment management:**
```javascript
✅ Create/edit/delete environments
✅ Manage environment variables
✅ View secret values
✅ Switch active environment
```

**Limited team access:**
```javascript
❌ Cannot invite new members
❌ Cannot change member roles
❌ Cannot remove members
✅ Can view current members
✅ Can leave workspace
```

**Limited workspace control:**
```javascript
❌ Cannot edit workspace settings
❌ Cannot delete workspace
✅ Can view workspace details
```

**Use cases:**
- **Backend Developer**: "I create requests for endpoints I'm building and run tests"
- **QA Engineer**: "I create comprehensive test collections and run automated suites"
- **API Tester**: "I test API behavior with different payloads and environments"

---

### VIEWER

**Who should be VIEWER:**
- Frontend developers (read API contracts)
- Product managers (review API coverage)
- Stakeholders (observe testing progress)
- External partners (limited access)
- Anyone who needs read-only visibility

**Capabilities:**

**Read-only access:**
```javascript
✅ View all collections
✅ View all requests (URL, method, headers, body)
✅ View all folders
✅ View collection scripts and variables
```

**Environment viewing:**
```javascript
✅ View environment names
✅ View environment variable keys
❌ Cannot see secret values (masked)
✅ See which environment is active
```

**History visibility:**
```javascript
✅ View request history
✅ See response data from past executions
❌ Cannot re-run requests
❌ Cannot send new requests
```

**Team visibility:**
```javascript
✅ View workspace members and their roles
❌ Cannot invite or remove members
✅ Can leave workspace
```

**No modification:**
```javascript
❌ Cannot create/edit/delete collections
❌ Cannot create/edit/delete requests
❌ Cannot send requests
❌ Cannot run collection runner
❌ Cannot edit environments
❌ Cannot manage workspace settings
```

**Use cases:**
- **Frontend Developer**: "I need to see API contracts and example requests for integration"
- **Product Manager**: "I want visibility into API test coverage without accidentally changing anything"
- **External Partner**: "We need read-only access to API documentation and examples"
- **Auditor**: "I need to review API testing practices without modifying tests"

---

## Role Assignment Workflows

### Scenario 1: New Team Member Onboarding

**Situation:** New developer joins team

**Workflow:**
```
1. OWNER invites new developer with VIEWER role
   "Let them explore workspace safely first"

2. New developer accepts invitation, explores collections
   "I can see requests but can't modify anything"

3. After onboarding period, OWNER promotes to EDITOR
   "Now they can create their own requests"

4. Over time, if they become team lead, promote to OWNER
   "They now manage the workspace and team"
```

### Scenario 2: External Stakeholder Access

**Situation:** Product manager needs API visibility

**Workflow:**
```
1. OWNER invites product manager as VIEWER
   "They can see what we're testing but not interfere"

2. Product manager views collections
   "I can see coverage but won't accidentally break tests"

3. Product manager requests changes via team communication
   "Can you add test for edge case X?"

4. EDITOR implements changes
   "Done, you can view the new test now"
```

### Scenario 3: Temporary Collaborator

**Situation:** Consultant helps with API testing temporarily

**Workflow:**
```
1. OWNER invites consultant as EDITOR
   "They need to create tests during engagement"

2. Consultant creates test collections
   "I can work independently"

3. After engagement ends, OWNER changes role to VIEWER
   "They can reference their work but not modify"

4. Eventually, OWNER removes consultant
   "Engagement complete, access revoked"
```

### Scenario 4: Security-Sensitive Production Workspace

**Situation:** Production API monitoring workspace

**Workflow:**
```
1. OWNER creates production workspace
   "Strict access control needed"

2. OWNER invites DevOps team as EDITOR
   "They need to run health checks"

3. OWNER invites Dev team as VIEWER
   "They can see production status, read-only"

4. OWNER reviews members quarterly
   "Remove anyone who changed roles or left team"
```

---

## Changing Member Roles

### Grant More Permissions

**VIEWER → EDITOR:**
```
Workspace Settings → Members → Find user → Change role to EDITOR
```

**Use when:**
- Team member needs to create/modify requests
- Temporary restriction period ended
- Promoted from stakeholder to active contributor

**EDITOR → OWNER:**
```
Workspace Settings → Members → Find user → Change role to OWNER
```

**Use when:**
- Team member becomes team lead
- Sharing administrative responsibilities
- Original owner leaving, transferring ownership

### Restrict Permissions

**OWNER → EDITOR:**
```
Workspace Settings → Members → Find user → Change role to EDITOR
```

**Use when:**
- Sharing ownership no longer needed
- Team lead stepping down
- Security policy requires fewer owners

**Note:** Must have at least one OWNER in workspace

**EDITOR → VIEWER:**
```
Workspace Settings → Members → Find user → Change role to VIEWER
```

**Use when:**
- Team member moved to different project (read-only archive access)
- Security incident requires revoking modification access
- Consultant engagement ended
- Team member on leave

---

## Multiple Owners

### Why Multiple Owners?

**Benefits:**
- **Redundancy**: No single point of failure
- **Shared responsibility**: Team leads collaborate on management
- **Time zones**: Different owners in different regions
- **Succession planning**: Smooth transition when primary owner leaves

**Drawbacks:**
- **Confusion**: Who is responsible for what?
- **Security**: More people with deletion privileges
- **Conflicts**: Multiple owners may make conflicting decisions

### Best Practices

**Recommended:**
```
Small team (< 5 people):    1 OWNER
Medium team (5-15 people):  2 OWNERS
Large team (15+ people):    2-3 OWNERS
```

**Explicitly define responsibilities:**
```
Primary Owner (Alice):
  - Invite/remove members
  - Workspace settings

Secondary Owner (Bob):
  - Backup admin when Alice unavailable
  - Handle urgent access requests
```

**Communicate ownership:**
```
Workspace Settings → Description:
"Workspace Owners: Alice (primary), Bob (backup)
For access requests, contact Alice first."
```

---

## Special Permissions

### Environment Secrets

**Secret values (masked by default):**

**OWNER:**
```
Environment: Production
  BASE_URL:       https://api.example.com  (visible)
  API_KEY:        ************************  (click to reveal)
  DB_PASSWORD:    ************************  (click to reveal)
```

**EDITOR:**
```
Environment: Production
  BASE_URL:       https://api.example.com  (visible)
  API_KEY:        ************************  (click to edit, will see value)
  DB_PASSWORD:    ************************  (click to edit, will see value)
```

**VIEWER:**
```
Environment: Production
  BASE_URL:       https://api.example.com  (visible)
  API_KEY:        ************************  (always masked, cannot reveal)
  DB_PASSWORD:    ************************  (always masked, cannot reveal)
```

**Best practice:** Use environment variables for sensitive data to limit VIEWER exposure

### Request History

**All roles can view history:**
```
History Entry:
  Request: POST /api/users
  Status: 201 Created
  Response: User created successfully
  Timestamp: 2024-03-15 10:30 AM
```

**Only OWNER and EDITOR can:**
- Re-run request from history
- Clear history entries
- Export history

**Use case:** VIEWER can review test results but cannot re-execute (prevents accidental production requests)

---

## Permission Enforcement

### What Happens When VIEWER Tries to Edit?

**UI behavior:**
```
VIEWER opens request → All fields are read-only

Instead of "Send" button:
  [Copy to Personal Workspace]
```

**VIEWER attempts to edit URL:**
```
❌ Error: "You do not have permission to edit this request.
         Contact workspace owner to request EDITOR role."
```

**VIEWER attempts to run collection:**
```
❌ Error: "Collection Runner requires EDITOR role.
         Contact workspace owner for access."
```

### What Happens When EDITOR Tries Admin Action?

**EDITOR attempts to invite member:**
```
❌ Error: "Only workspace OWNER can invite members.
         Contact [Owner Name] to request invitation."
```

**EDITOR attempts to delete workspace:**
```
❌ Error: "Only workspace OWNER can delete workspace.
         This is a destructive action requiring OWNER privileges."
```

---

## Security Best Practices

### ✅ DO

**Start restrictive, grant access as needed:**
```
New member → VIEWER first → Observe → Promote to EDITOR when ready
```

**Use separate workspaces for different security levels:**
```
Development Workspace:  All devs as EDITOR
Staging Workspace:      Devs as EDITOR, QA as EDITOR
Production Workspace:   DevOps as EDITOR, Devs as VIEWER
```

**Regular access audits:**
```
Quarterly: Review member list
  - Remove inactive members
  - Downgrade members who changed roles
  - Verify external consultants still need access
```

**Document role rationale:**
```
Workspace Description:
"EDITOR: Active developers and QA
 VIEWER: Frontend team (API consumers), Product managers
 Contact Alice for access changes"
```

### ❌ DON'T

**Don't grant OWNER to everyone:**
```
❌ 5 OWNERS in 6-person workspace (unnecessary risk)
✅ 1-2 OWNERS in 6-person workspace (appropriate)
```

**Don't use single workspace for all environments:**
```
❌ One workspace with Dev + Staging + Prod environments
   (Production secrets visible to all members)

✅ Separate workspaces for Prod (restricted) and Dev/Staging (open)
```

**Don't keep external consultants indefinitely:**
```
❌ Consultant left 6 months ago, still has EDITOR access

✅ Remove consultant when engagement ends
   (or downgrade to VIEWER if they need reference access)
```

**Don't skip onboarding:**
```
❌ New hire → EDITOR role immediately

✅ New hire → VIEWER role → Onboarding → EDITOR after 1-2 weeks
```

---

## Troubleshooting

### "I can't see collections in workspace"

**Possible causes:**
1. Workspace has no collections yet (empty)
2. You were removed from workspace
3. Wrong workspace selected (check workspace dropdown)

**Solution:** Verify workspace membership in Workspace Settings → Members

### "I can see requests but can't send them"

**Cause:** You have VIEWER role

**Solution:** Request workspace owner to change your role to EDITOR

### "I was EDITOR yesterday, now I'm VIEWER"

**Cause:** Workspace owner changed your role

**Solution:** Contact workspace owner to discuss reason and request restoration if appropriate

### "Can't change another member's role"

**Cause:** Only OWNER can change roles

**Solution:** You have EDITOR role. Contact workspace owner to request role change for another member.

### "Can't delete workspace even though I'm OWNER"

**Possible causes:**
1. Workspace has pending operations (wait for completion)
2. Browser issue (refresh and try again)

**Solution:** Try from Workspace Settings → Danger Zone → Delete Workspace

---

## Role Comparison Examples

### Scenario: Editing a Request

**OWNER sees:**
```
URL:        [https://api.example.com/users     ] (editable)
Method:     [GET ▼]                             (editable)
Headers:    [+ Add Header]                      (editable)
Body:       [JSON editor]                       (editable)

[Send Request]  [Save]  [Delete]
```

**EDITOR sees:**
```
URL:        [https://api.example.com/users     ] (editable)
Method:     [GET ▼]                             (editable)
Headers:    [+ Add Header]                      (editable)
Body:       [JSON editor]                       (editable)

[Send Request]  [Save]  [Delete]
```

**VIEWER sees:**
```
URL:        https://api.example.com/users        (read-only, gray)
Method:     GET                                   (read-only)
Headers:    Authorization: Bearer ***            (read-only)
Body:       { "name": "John" }                    (read-only)

[Copy to Personal Workspace]
```

### Scenario: Viewing Workspace Settings

**OWNER sees:**
```
Workspace Settings

General:
  Name:         [Backend API Team        ] (editable)
  Description:  [Team collaboration...  ] (editable)
  [Save Changes]

Members:
  Alice Johnson  OWNER   [Change Role ▼] [Remove]
  Bob Smith      EDITOR  [Change Role ▼] [Remove]
  [+ Invite Member]

Danger Zone:
  [Delete Workspace]
```

**EDITOR sees:**
```
Workspace Settings

General:
  Name:         Backend API Team            (read-only)
  Description:  Team collaboration...       (read-only)

Members:
  Alice Johnson  OWNER
  Bob Smith      EDITOR  (you)
  Carol White    VIEWER
```

**VIEWER sees:**
```
Workspace Settings

General:
  Name:         Backend API Team            (read-only)
  Description:  Team collaboration...       (read-only)

Members:
  Alice Johnson  OWNER
  Bob Smith      EDITOR
  Carol White    VIEWER  (you)
```

---

## Related Topics

- [Workspace Sharing](workspace-sharing.md) - Invite members and collaborate
- [Workspaces](../core-concepts/workspaces.md) - Workspace fundamentals
- [Environments](../core-concepts/environments.md) - Manage environment variables
- [Collections](../core-concepts/collections.md) - Organize requests in shared collections
- [Import/Export](import-export.md) - Share collections with external teams
