# Workspace Management Implementation Prompts

This document contains detailed prompts for implementing workspace management functionality. This bridges the gap between Phase 1.3 (Authentication) and Phase 2 (Basic Request Handling).

---

## Overview

Workspaces provide organizational structure for users to manage their API testing projects. Each workspace can contain collections, environments, and request history. Users can create multiple workspaces and switch between them.

---

## Prompt WS-1: Backend Workspace API Endpoints

```
Implement backend API endpoints for workspace management:

Create the following endpoints:

1. POST /api/workspaces
   - Create a new workspace
   - Input: { name: string }
   - Auto-assign current user as owner
   - Return created workspace with ID
   - Create a default environment for the workspace

2. GET /api/workspaces
   - List all workspaces for the authenticated user
   - Return array of workspaces with basic info
   - Include workspace count of collections and environments
   - Sort by most recently updated

3. GET /api/workspaces/:id
   - Get detailed workspace information
   - Include collections count, environments count
   - Include owner information
   - Return 404 if workspace not found or user doesn't have access

4. PUT /api/workspaces/:id
   - Update workspace details
   - Allow updating: name
   - Validate user is workspace owner
   - Return updated workspace

5. DELETE /api/workspaces/:id
   - Delete workspace and all associated data
   - Validate user is workspace owner
   - Cascade delete: collections, requests, environments, request history
   - Prevent deletion if it's the user's only workspace
   - Return success message

6. POST /api/workspaces/:id/duplicate
   - Duplicate workspace with all collections and environments
   - Generate new IDs for all entities
   - Set current user as owner of duplicated workspace
   - Return duplicated workspace

Backend structure:
- Create WorkspaceService.ts in /backend/src/services/
- Create workspace.routes.ts in /backend/src/routes/
- Add routes to app.ts
- Use authenticate middleware for all endpoints
- Add proper error handling and validation
- Return appropriate HTTP status codes

Validation rules:
- Workspace name: required, 1-100 characters
- User must be authenticated
- User can only access/modify their own workspaces
```

---

## Prompt WS-2: Frontend Workspace Store

```
Create a Zustand store for workspace management:

Create /frontend/src/stores/workspaceStore.ts with:

State:
- workspaces: Workspace[] (list of all user workspaces)
- currentWorkspace: Workspace | null (active workspace)
- isLoading: boolean
- error: string | null

Workspace interface:
{
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  collectionsCount?: number;
  environmentsCount?: number;
}

Actions:
1. fetchWorkspaces()
   - Call GET /api/workspaces
   - Update workspaces array
   - If currentWorkspace is null, set to first workspace
   - Handle errors

2. setCurrentWorkspace(workspaceId: string)
   - Find workspace by ID
   - Update currentWorkspace
   - Persist to localStorage
   - Trigger refetch of collections/environments

3. createWorkspace(name: string)
   - Call POST /api/workspaces
   - Add to workspaces array
   - Set as currentWorkspace
   - Show success toast

4. updateWorkspace(id: string, updates: Partial<Workspace>)
   - Call PUT /api/workspaces/:id
   - Update in workspaces array
   - Update currentWorkspace if it's the active one
   - Show success toast

5. deleteWorkspace(id: string)
   - Call DELETE /api/workspaces/:id
   - Remove from workspaces array
   - If deleted workspace was current, switch to another
   - Show success toast

6. duplicateWorkspace(id: string)
   - Call POST /api/workspaces/:id/duplicate
   - Add duplicated workspace to array
   - Show success toast

Persistence:
- Store currentWorkspaceId in localStorage
- Auto-restore on app load
- Initialize workspaces on first render

Integration with auth:
- Clear workspace state on logout
- Fetch workspaces after successful login
```

---

## Prompt WS-3: Workspace Service (Frontend API Client)

```
Create workspace service for API communication:

Create /frontend/src/services/workspaceService.ts with:

Functions:

1. getWorkspaces()
   - GET /api/workspaces
   - Return Promise<Workspace[]>
   - Handle network errors

2. getWorkspace(id: string)
   - GET /api/workspaces/:id
   - Return Promise<Workspace>
   - Handle 404 errors

3. createWorkspace(data: { name: string })
   - POST /api/workspaces
   - Return Promise<Workspace>
   - Validate input

4. updateWorkspace(id: string, data: { name: string })
   - PUT /api/workspaces/:id
   - Return Promise<Workspace>
   - Validate input

5. deleteWorkspace(id: string)
   - DELETE /api/workspaces/:id
   - Return Promise<void>
   - Confirm before deletion

6. duplicateWorkspace(id: string)
   - POST /api/workspaces/:id/duplicate
   - Return Promise<Workspace>

Error handling:
- Catch and format error messages
- Return user-friendly error messages
- Handle authentication errors (redirect to login)
- Handle network errors

Use axios instance from api.ts for authenticated requests.
```

---

## Prompt WS-4: Workspace Selector Component (TopNavbar)

```
Create workspace selector dropdown in TopNavbar:

Update /frontend/src/components/layout/TopNavbar.tsx to add:

Component: WorkspaceSelector (can be inline or separate file)

UI Elements:
1. Dropdown trigger button:
   - Display current workspace name
   - Workspace icon
   - Dropdown arrow icon
   - Truncate long names with tooltip

2. Dropdown menu:
   - List all user workspaces
   - Highlight current workspace (checkmark)
   - Show workspace name
   - Hover effect on items
   - Click to switch workspace

3. Dropdown footer actions:
   - "Create Workspace" button
   - "Manage Workspaces" button (opens settings)
   - Divider line above footer

4. Empty state:
   - If no workspaces, show "Create your first workspace"
   - CTA button to create workspace

Interactions:
- Click workspace to switch (update store)
- Click create to open create dialog
- Click manage to open workspace management modal
- Close on outside click or escape key

Styling:
- Use consistent design with user menu dropdown
- Position below trigger
- Max height with scroll for many workspaces
- Loading state while switching
- Smooth animations

Integration:
- Use useWorkspaceStore to access state
- Call setCurrentWorkspace on selection
- Update UI reactively when workspace changes
```

---

## Prompt WS-5: Create Workspace Dialog

```
Create a modal dialog for creating new workspaces:

Create /frontend/src/components/workspace/CreateWorkspaceDialog.tsx:

Props:
- isOpen: boolean
- onClose: () => void
- onSuccess?: (workspace: Workspace) => void

Form fields:
1. Workspace name input
   - Label: "Workspace Name"
   - Placeholder: "My API Project"
   - Required
   - Auto-focus on open
   - Max length: 100 characters
   - Real-time validation

Validation:
- Name is required
- Name must be 1-100 characters
- Show error messages below field
- Disable submit button while invalid

UI Elements:
- Modal overlay (dark background)
- Modal container (centered, white, rounded)
- Title: "Create New Workspace"
- Close button (X in top right)
- Name input field
- Description text: "Organize your API collections and environments"
- Cancel button
- Create button (primary, with loading state)

Behavior:
1. On submit:
   - Validate input
   - Call workspaceStore.createWorkspace()
   - Show loading state on button
   - On success:
     * Close dialog
     * Show success toast
     * Call onSuccess callback
   - On error:
     * Show error message
     * Keep dialog open
     * Clear loading state

2. On cancel/close:
   - Reset form
   - Close dialog

Keyboard shortcuts:
- Enter to submit (if valid)
- Escape to close

Accessibility:
- ARIA labels
- Focus trap in modal
- Announce to screen readers
```

---

## Prompt WS-6: Workspace Management Modal

```
Create workspace management interface:

Create /frontend/src/components/workspace/WorkspaceManagementModal.tsx:

Layout:
- Full-screen modal or large centered modal
- Title: "Manage Workspaces"
- Close button

Content sections:

1. Workspace list:
   - Card layout for each workspace
   - Show for each workspace:
     * Workspace name (editable inline)
     * Owner badge (if current user)
     * Created date
     * Collections count
     * Environments count
     * Last updated
   - Actions per workspace:
     * Edit (inline rename)
     * Duplicate
     * Delete (with confirmation)
     * Set as active (if not current)

2. Workspace card design:
   ```
   +------------------------------------------+
   | 📁 Workspace Name                    [...] |
   | Created: Dec 10, 2024                     |
   | Collections: 5  |  Environments: 3        |
   |                                            |
   | [Switch to] [Duplicate] [Delete]          |
   +------------------------------------------+
   ```

3. Create new workspace button:
   - Prominent button at top
   - Opens create dialog

Features:
1. Inline rename:
   - Click workspace name to edit
   - Press Enter to save
   - Press Escape to cancel
   - Auto-save on blur

2. Delete confirmation:
   - Show confirmation dialog
   - Warning if workspace has collections
   - Prevent deleting last workspace
   - Type workspace name to confirm

3. Duplicate workspace:
   - Show progress indicator
   - Auto-switch to duplicated workspace option
   - Success notification

4. Search/filter:
   - Search box at top
   - Filter workspaces by name
   - Show count of filtered results

State management:
- Use workspaceStore for data
- Local state for UI interactions
- Optimistic updates where appropriate

Error handling:
- Show error toasts
- Graceful failure recovery
- Retry mechanism for failed operations
```

---

## Prompt WS-7: Auto-create Default Workspace

```
Implement automatic default workspace creation:

When a user registers, automatically create a default workspace:

Backend changes (AuthService.ts):
1. In register() method, after creating user:
   - Create a default workspace named "My Workspace"
   - Set the new user as owner
   - Create a default environment named "Development"
   - Return workspace info in registration response (optional)

2. Update register endpoint response to include:
   ```typescript
   {
     user: User,
     tokens: AuthTokens,
     workspace?: {
       id: string,
       name: string
     }
   }
   ```

Frontend changes:
1. After successful registration:
   - Fetch workspaces immediately
   - Set first workspace as current
   - Initialize workspace store

2. After successful login:
   - Fetch workspaces
   - Restore last active workspace from localStorage
   - If no workspace found, redirect to create workspace

3. App initialization (main component):
   - Check if user is authenticated
   - If authenticated but no workspace:
     * Show "Create Workspace" screen
     * Cannot access main app until workspace exists
   - If workspace exists:
     * Load workspace data
     * Render main app

Migration considerations:
- For existing users without workspaces:
  * Create default workspace on first login after migration
  * Check in WorkspaceService if user has no workspaces
  * Auto-create and notify user
```

---

## Prompt WS-8: Workspace Context & Route Protection

```
Integrate workspace context throughout the application:

1. Create workspace context hook:
   Create /frontend/src/hooks/useWorkspace.ts:
   ```typescript
   export function useWorkspace() {
     const { currentWorkspace, isLoading } = useWorkspaceStore();
     
     if (!currentWorkspace) {
       throw new Error('No workspace selected');
     }
     
     return { workspace: currentWorkspace, isLoading };
   }
   ```

2. Update protected routes:
   - Extend ProtectedRoute component
   - Check for workspace existence
   - If no workspace, redirect to workspace setup
   - Show loading state while checking

3. Update API calls to include workspace context:
   - Collections API: /api/workspaces/:workspaceId/collections
   - Environments API: /api/workspaces/:workspaceId/environments
   - Automatically inject workspaceId from store

4. Update existing components:
   - CollectionService: add workspaceId parameter
   - EnvironmentService: add workspaceId parameter
   - RequestService: derive workspaceId from collection

5. Create workspace loading screen:
   - Show while fetching workspaces
   - Show spinner or skeleton
   - Handle loading errors

6. Create "No Workspace" screen:
   - Show when user has no workspaces
   - Prominent "Create Workspace" button
   - Explanation text
   - Cannot access main app features

Route structure:
```
/login (public)
/register (public)
/forgot-password (public)
/reset-password (public)
/ (protected)
  ├─ Check authentication
  ├─ Check workspace exists
  ├─ Load workspace data
  └─ Render main app (Layout)
```

Error handling:
- Handle workspace not found (deleted by another session)
- Handle workspace access denied (permissions change)
- Graceful fallback to workspace selection
```

---

## Prompt WS-9: Workspace Switching UX

```
Implement smooth workspace switching experience:

Requirements:
1. When switching workspaces:
   - Show loading overlay on main content
   - Clear current collections/environments/history
   - Fetch new workspace data
   - Update URL if workspace-specific routes exist
   - Preserve user's position in UI where possible
   - Show success notification

2. Loading states:
   - Disable workspace selector while switching
   - Show spinner in navbar
   - Gray out main content area
   - Prevent user actions during switch
   - Timeout after 10 seconds (show error)

3. Data persistence:
   - Save workspace preference to localStorage
   - Restore on next session
   - Clear on logout

4. Optimistic updates:
   - Update UI immediately when switching
   - Show skeleton loaders while fetching data
   - Roll back if fetch fails

5. Error handling:
   - If workspace no longer exists, remove from list
   - If access denied, show error and stay on current workspace
   - If fetch fails, retry with exponential backoff
   - Allow manual retry

Implementation:
1. Create useWorkspaceSwitch hook:
   ```typescript
   export function useWorkspaceSwitch() {
     const switchWorkspace = async (workspaceId: string) => {
       // Set loading state
       // Clear current data
       // Update current workspace
       // Fetch workspace data
       // Handle errors
       // Clear loading state
     };
     
     return { switchWorkspace, isSwitching };
   }
   ```

2. Update stores to clear on workspace change:
   - collectionStore.clearCollections()
   - environmentStore.clearEnvironments()
   - historyStore.clearHistory()

3. Add transition animations:
   - Fade out old content
   - Fade in new content
   - Smooth transition between states

4. Keyboard shortcut:
   - Cmd/Ctrl + Shift + W to open workspace switcher
   - Arrow keys to navigate workspaces
   - Enter to switch

Testing considerations:
- Test switching between workspaces rapidly
- Test switching while requests are in flight
- Test switching with unsaved changes (show warning)
- Test switching when workspace is deleted
```

---

## Prompt WS-10: Workspace Settings & Preferences

```
Add workspace-level settings:

Create /frontend/src/components/workspace/WorkspaceSettingsModal.tsx:

Settings sections:

1. General:
   - Workspace name (editable)
   - Workspace description (new field, optional)
   - Created date (read-only)
   - Owner (read-only)
   - Workspace ID (read-only, with copy button)

2. Danger Zone:
   - Delete workspace button (red)
   - Confirmation required
   - Shows warning about data loss
   - Disabled if last workspace

3. Advanced (future features):
   - Default environment
   - Timeout settings
   - SSL certificate verification toggle
   - Proxy settings
   - Custom variables

Backend additions:
1. Update Workspace model to include:
   - description: String?
   - settings: Json? @default("{}")

2. Update PUT /api/workspaces/:id to accept:
   - name
   - description
   - settings

UI Layout:
```
+----------------------------------------+
| Workspace Settings                    X |
+----------------------------------------+
| [General] [Members] [Danger Zone]      |
+----------------------------------------+
|                                         |
| Workspace Name                          |
| [My API Project____________]            |
|                                         |
| Description (optional)                  |
| [_________________________]             |
|                                         |
| Created: December 10, 2024              |
| Owner: user@example.com                 |
| Workspace ID: abc-123-def               |
| [Copy ID]                               |
|                                         |
|                     [Cancel] [Save]     |
+----------------------------------------+
```

Features:
- Real-time validation
- Unsaved changes warning
- Auto-save option (debounced)
- Settings export/import (JSON)
- Reset to defaults option

Access from:
- Workspace management modal
- Settings icon in workspace selector
- Keyboard shortcut (Cmd/Ctrl + ,)
```

---

## Summary

These prompts will implement a complete workspace management system including:

✅ Backend API endpoints for CRUD operations
✅ Frontend store for state management
✅ Workspace selector in TopNavbar
✅ Create/Edit/Delete workspace functionality
✅ Workspace switching with proper UX
✅ Auto-creation of default workspace
✅ Workspace settings and preferences
✅ Route protection requiring workspace
✅ Smooth transitions and loading states

**Implementation Order:**
1. Start with WS-1 (Backend API)
2. Then WS-2 & WS-3 (Frontend store & service)
3. Then WS-4 & WS-5 (UI components)
4. Then WS-7 (Auto-create default)
5. Then WS-8 (Context & route protection)
6. Finally WS-6, WS-9, WS-10 (Polish & settings)

After completing these prompts, the application will have full workspace management and be ready for Phase 2: Basic Request Handling.
