# Code Review Feedback

## frontend/src/components/request/URLBar.tsx
- ❌ Build blocker: missing closing `</svg>` in the Save button icon after the path element, causing Vite parse errors (`Unexpected token` / `Unterminated regular expression`). See [frontend/src/components/request/URLBar.tsx#L252-L259](frontend/src/components/request/URLBar.tsx#L252-L259). Add the closing tag.

## frontend/src/components/request/URLBar.tsx (behavior)
- ✅ Good: Send button now ignores viewer restriction and only checks `isLoading || !url`. Keep this as-is for read-only send.

## Untracked frontend files (need add or remove to avoid runtime import failures)
- [frontend/src/types/workspace.types.ts](frontend/src/types/workspace.types.ts)
- [frontend/src/hooks/useWorkspacePermission.ts](frontend/src/hooks/useWorkspacePermission.ts)
- [frontend/src/components/workspace/AddMemberDialog.tsx](frontend/src/components/workspace/AddMemberDialog.tsx)
- [frontend/src/components/workspace/WorkspaceSettings.tsx](frontend/src/components/workspace/WorkspaceSettings.tsx)
- [frontend/src/services/workspaceMemberService.ts](frontend/src/services/workspaceMemberService.ts)

## Untracked backend files (need add or remove to avoid missing route/middleware)
- [backend/src/middleware/workspace.middleware.ts](backend/src/middleware/workspace.middleware.ts)
- [backend/src/routes/workspaceMembers.routes.ts](backend/src/routes/workspaceMembers.routes.ts)
- [backend/src/services/WorkspaceMemberService.ts](backend/src/services/WorkspaceMemberService.ts)

## backend/src/app.ts
- 🔎 Mounts new member routes at `${API_PREFIX}`; confirm no path collisions with existing routes. Otherwise looks fine; CORS list updated for 5174/127.0.0.1.

## frontend/src/hooks/useWorkspacePermission.ts
- ⚠️ `isViewer` is defined as `userRole === VIEWER || isEditor`, so it is `true` for editors/owners. If you ever gate UI on `isViewer`, it will hide actions for editors/owners too. Prefer `const isViewer = userRole === WorkspaceRole.VIEWER;` and keep `isEditor`/`isOwner` for upgrades.

## General
- Add tests/run app after fixing the SVG to ensure Vite build succeeds.
- If any of the untracked files are not meant for commit, add them to .gitignore; otherwise `git add` them so imports resolve during CI/build.
