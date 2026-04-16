# Screenshots Directory

This directory contains screenshots for the Simba documentation.

## Required Screenshots

### Getting Started
- [ ] `welcome-screen.png` - Initial login/welcome screen
- [ ] `workspace-creation.png` - Create workspace dialog
- [ ] `interface-overview.png` - Main interface with labeled sections
- [ ] `sidebar-navigation.png` - Collection sidebar navigation

### Request Builder
- [ ] `request-builder-overview.png` - Full request builder interface
- [ ] `url-bar-method-selector.png` - URL bar with method dropdown
- [ ] `request-tabs.png` - Params, Headers, Body, Auth tabs
- [ ] `params-tab.png` - Query parameters editor
- [ ] `headers-tab.png` - Headers key-value editor
- [ ] `body-tab-json.png` - JSON body editor
- [ ] `body-tab-form-data.png` - Form data editor
- [ ] `body-tab-raw.png` - Raw body editor
- [ ] `auth-tab-bearer.png` - Bearer token auth
- [ ] `auth-tab-basic.png` - Basic auth
- [ ] `auth-tab-api-key.png` - API key auth

### Response Viewer
- [ ] `response-viewer-overview.png` - Full response viewer
- [ ] `response-body-json.png` - JSON response view
- [ ] `response-headers.png` - Response headers
- [ ] `response-cookies.png` - Response cookies
- [ ] `test-results-passing.png` - Passing test results
- [ ] `test-results-failing.png` - Failing test results
- [ ] `response-status-bar.png` - Status code, time, size

### Collections
- [ ] `collection-tree.png` - Collection tree view
- [ ] `collection-create-dialog.png` - Create collection dialog
- [ ] `folder-create-dialog.png` - Create folder dialog
- [ ] `request-create-dialog.png` - Create request dialog
- [ ] `collection-context-menu.png` - Right-click context menu
- [ ] `collection-runner-dialog.png` - Collection runner interface
- [ ] `collection-runner-results.png` - Runner execution results

### Environments
- [ ] `environment-selector.png` - Environment dropdown
- [ ] `environment-create-dialog.png` - Create environment dialog
- [ ] `environment-variables-editor.png` - Environment variables editor
- [ ] `environment-quick-look.png` - Quick environment preview
- [ ] `variable-syntax-example.png` - Using {{variable}} syntax

### GraphQL
- [ ] `graphql-query-editor.png` - GraphQL query editor
- [ ] `graphql-variables-tab.png` - GraphQL variables
- [ ] `graphql-schema-explorer.png` - Schema introspection
- [ ] `graphql-response.png` - GraphQL response

### Scripts
- [ ] `pre-request-script-editor.png` - Pre-request script tab
- [ ] `test-script-editor.png` - Test script tab
- [ ] `script-autocomplete.png` - pm.* API autocomplete
- [ ] `console-output.png` - Console logs from scripts

### Workspace & Collaboration
- [ ] `workspace-settings.png` - Workspace settings panel
- [ ] `workspace-members.png` - Team members management
- [ ] `workspace-permissions.png` - Permission settings
- [ ] `workspace-switcher.png` - Workspace switcher dropdown

### Import/Export
- [ ] `import-collection-dialog.png` - Import collection dialog
- [ ] `export-collection-dialog.png` - Export collection dialog
- [ ] `postman-import-preview.png` - Postman import preview

### History
- [ ] `request-history-panel.png` - Request history sidebar
- [ ] `history-item-details.png` - History item details

### Data-Driven Testing
- [ ] `data-file-upload.png` - CSV/JSON file upload
- [ ] `data-driven-config.png` - Data-driven test configuration
- [ ] `data-driven-results.png` - Data-driven execution results

## Screenshot Guidelines

### Resolution
- **Recommended**: 1920x1080 or higher
- **Format**: PNG (for UI clarity)
- **Max file size**: 500KB per image

### Capture Settings
- Use browser at 100% zoom (not zoomed in/out)
- Capture at normal window size (not fullscreen)
- Include relevant UI context
- Avoid capturing sensitive data (tokens, passwords)

### Post-Processing
1. **Crop** to relevant area
2. **Annotate** with arrows/labels if needed
3. **Optimize** file size (use TinyPNG or similar)
4. **Name** following convention below

### Naming Convention

```
{feature}-{action}-{state}.png

Examples:
✅ workspace-create-dialog.png
✅ request-builder-get-method.png
✅ response-viewer-json-body.png
✅ test-results-passing.png
✅ collection-runner-executing.png

❌ screenshot1.png
❌ Screen Shot 2024-01-15 at 3.45.23 PM.png
❌ IMG_0123.png
```

## Tools

### macOS
- Built-in: `Cmd + Shift + 4`
- Preview app for editing

### Windows
- Snipping Tool: `Win + Shift + S`
- Paint 3D for editing

### Cross-Platform
- [ShareX](https://getsharex.com/) (Windows)
- [Flameshot](https://flameshot.org/) (Linux)
- Browser DevTools screenshot feature

### Optimization
- [TinyPNG](https://tinypng.com/) - Compress PNG files
- [Squoosh](https://squoosh.app/) - Browser-based image optimizer
- [ImageOptim](https://imageoptim.com/) (macOS) - Desktop optimizer

## Adding to Documentation

```markdown
![Request Builder Overview](../assets/screenshots/request-builder-overview.png)
*The request builder interface showing a GET request with headers*
```

## Current Status

### ✅ Completed
- Directory structure created

### 📸 Needed (Priority)
1. Interface overview
2. Request builder (GET/POST examples)
3. Response viewer
4. Collection tree
5. Environment selector
6. Test results

### 📸 Needed (Secondary)
- GraphQL interface
- Script editors
- Collection runner
- Workspace settings
- Import/export dialogs

## Notes
- Screenshots should represent the **current** UI state
- Update screenshots when UI changes significantly
- Use realistic but safe example data (JSONPlaceholder, public APIs)
- Avoid capturing your actual API keys or sensitive endpoints
