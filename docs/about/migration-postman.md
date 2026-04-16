# Migration from Postman

Complete guide to migrating your existing Postman collections to Simba.

---

## Why Migrate to Simba?

**Advantages:**
- ✅ **Open Source** - No vendor lock-in, fully customizable
- ✅ **Self-Hosted** - Complete data privacy and control
- ✅ **Hybrid Database** - PostgreSQL + MongoDB for optimal performance
- ✅ **Modern UI** - Built with React and TypeScript
- ✅ **Team Collaboration** - Built-in workspace sharing and permissions
- ✅ **CI/CD Ready** - Azure DevOps, GitHub Actions support
- ✅ **GraphQL Native** - First-class GraphQL support with introspection

---

## What's Compatible?

### ✅ Fully Compatible

**Collections:**
- Postman Collection v2.1 format
- Folders and request organization
- Request methods (GET, POST, PUT, PATCH, DELETE)
- Headers, query parameters, body (JSON, form-data, raw)

**Scripts:**
- Pre-request scripts (JavaScript)
- Test scripts with `pm.*` API
- Environment variable access (`pm.environment.get/set`)
- Collection/Global variables

**Authentication:**
- Bearer Token
- Basic Auth
- API Key
- OAuth 2.0

**Environments:**
- Environment variables
- Variable syntax `{{variableName}}`

### ⚠️ Partially Compatible

**Collection Runner:**
- ✅ Sequential execution
- ✅ Data-driven testing (CSV, JSON)
- ⚠️ Limited iteration control (use CLI for advanced scenarios)

**Scripting API:**
- ✅ Most `pm.*` methods supported
- ⚠️ Some advanced methods may differ (see [Scripting API Reference](../reference/scripting-api.md))

### ❌ Not Yet Supported

**Advanced Features:**
- ⏳ Postman Monitors (use Azure DevOps scheduled pipelines instead)
- ⏳ Postman Mock Servers
- ⏳ Postman Flows (visual scripting)
- ⏳ Request chaining UI (use pre-request scripts instead)

---

## Migration Guide

### Step 1: Export from Postman

**Export Collection:**
```
Postman → Collection → ⋯ (three dots) → Export

Format: Collection v2.1 (recommended)

Save as: my-collection.postman_collection.json
```

**Export Environment:**
```
Postman → Environments → Select Environment → ⋯ → Export

Save as: my-environment.postman_environment.json
```

**Export Multiple Collections:**
```
Postman → Settings → Data → Export Data

Select:
  ☑ Collections
  ☑ Environments
  ☐ Globals (import as environment instead)

Save as: Postman-Data-2026-04-15.json
```

---

### Step 2: Import to Simba

**Import Collection:**
```
1. Open Simba → Your Workspace
2. Click "Import" button
3. Select file: my-collection.postman_collection.json
4. Choose import options:
   ☑ Import pre-request scripts
   ☑ Import test scripts
   ☑ Import collection variables
   ☐ Replace existing collection (if updating)
5. Click "Import"

Result: ✅ Collection imported with 47 requests
```

**Import Environment:**
```
1. Simba → Environments → Import
2. Select file: my-environment.postman_environment.json
3. Review variables:
   • baseUrl → ✅ Imported
   • apiKey → ⚠️ Secret values NOT imported (security)
4. Click "Import"
5. Manually set secret values:
   Environment → Edit → apiKey → (paste your key)
```

---

### Step 3: Verify and Test

**Check Imported Requests:**
```
1. Open collection → Expand folders
2. Verify request count matches Postman
3. Spot-check request details:
   • URL
   • Headers
   • Body
   • Auth configuration
```

**Test Key Requests:**
```
1. Select important request (e.g., "Get User Profile")
2. Click "Send"
3. Verify response matches expected
4. Check test scripts run correctly:
   Tests tab → ✅ 8/8 tests passed
```

**Run Collection:**
```
1. Collection → ⋯ → Run Collection
2. Select environment
3. Click "Run"
4. Verify all requests execute:
   Result: ✅ 47/47 requests succeeded
```

---

## Script Migration

### Postman API → Simba API

Most Postman scripts work unchanged, but here are key differences:

**Supported (No Changes Needed):**
```javascript
// Environment variables
pm.environment.get('baseUrl')
pm.environment.set('token', data.token)

// Collection variables
pm.variables.get('userId')
pm.variables.set('currentId', 123)

// Response data
pm.response.json()
pm.response.text()
pm.response.code
pm.response.time

// Tests
pm.test("Status is 200", () => {
    pm.expect(pm.response.code).to.equal(200);
});

// Assertions
pm.expect(user).to.have.property('email');
pm.expect(posts).to.be.an('array');
```

**Requires Changes:**

| Postman | Simba Alternative |
|---------|------------------|
| `pm.sendRequest()` | Use Collection Runner for chained requests |
| `pm.iterationData` | ✅ Supported in Collection Runner |
| `postman.setNextRequest()` | Use Collection Runner request ordering |
| `pm.cookies.get()` | Manual cookie management in scripts |

**Example Migration:**

```javascript
// ❌ Postman (not supported)
pm.sendRequest("https://api.example.com/users", (err, res) => {
    // Process response
});

// ✅ Simba (use Collection Runner)
// Split into separate request in collection
// Use pre-request script to set variables
```

---

## Authentication Migration

### Bearer Token

**Postman:**
```
Authorization tab → Type: Bearer Token → Token: {{token}}
```

**Simba:**
```
Auth tab → Type: Bearer Token → Token: {{token}}
```
✅ Identical - no changes needed

### OAuth 2.0

**Postman:**
```
Authorization → OAuth 2.0 → Get New Access Token
```

**Simba:**
```
Auth → OAuth 2.0 → Configure manually:
  • Authorization URL
  • Access Token URL
  • Client ID/Secret
  • Scopes
```
⚠️ Manual configuration required (no automatic token retrieval yet)

**Workaround:**
```
1. Follow [OAuth Flow Tutorial](../tutorials/oauth-flow.md)
2. Get access token manually
3. Save to environment variable
4. Use Bearer Token auth with {{accessToken}}
```

---

## Environment Variables Migration

### Variable Naming

Both Postman and Simba use `{{variableName}}` syntax - works identically.

### Secret Storage

**Postman:**
- Secrets stored in environment (type: secret)

**Simba:**
- Secrets stored in environment variables
- ⚠️ Not exported/imported for security
- Must manually re-enter after import

**Best Practice:**
```
After import:
1. Environment → Edit
2. Find variables with empty values
3. Re-enter secret values:
   • API keys
   • Passwords
   • OAuth tokens
   • Database credentials
```

---

## Collection Runner Comparison

### Data-Driven Testing

**Postman:**
```
Collection Runner → Select Data File (CSV/JSON)
```

**Simba:**
```
Collection → Run → Upload Data File → CSV/JSON
```
✅ Identical workflow

### Iterations

**Postman:**
```
Iterations: 100
Delay: 500ms
```

**Simba:**
```
✅ Iterations supported
⚠️ Delay configured in Collection settings
```

---

## Workspace Organization

### Postman Workspaces → Simba Workspaces

**Migration Strategy:**

```
Postman Workspace: "Development APIs"
  Collection: User Service
  Collection: Payment Service
  Environment: Dev
  Environment: Staging

↓ Import to Simba ↓

Simba Workspace: "Development APIs"
  ✅ Collection: User Service (imported)
  ✅ Collection: Payment Service (imported)
  ✅ Environment: Dev (imported, secrets re-entered)
  ✅ Environment: Staging (imported, secrets re-entered)
```

### Team Sharing

**Postman:**
- Workspace members with Editor/Viewer roles

**Simba:**
- Workspace members with Owner/Editor/Viewer roles
- [See Permissions Guide](../collaboration/permissions.md)

---

## Common Migration Issues

### Issue 1: Test Scripts Fail After Import

**Symptom:**
```
Pre-request Script: ReferenceError: postman is not defined
```

**Solution:**
```javascript
// ❌ Don't use
postman.setEnvironmentVariable('key', 'value');

// ✅ Use instead
pm.environment.set('key', 'value');
```

### Issue 2: OAuth Requests Don't Work

**Symptom:**
```
401 Unauthorized - token missing
```

**Solution:**
```
1. OAuth tokens not imported (security)
2. Follow OAuth setup manually
3. Update environment with new token
```

### Issue 3: Collection Variables Empty

**Symptom:**
```
Variables show as {{undefined}} in requests
```

**Solution:**
```
1. Verify collection variables imported:
   Collection → ⋯ → Edit → Variables tab
2. If missing, manually re-create:
   baseUrl = https://api.example.com
   version = v1
```

### Issue 4: Data Files Not Working

**Symptom:**
```
Collection Runner: No iteration data
```

**Solution:**
```
1. Re-upload CSV/JSON file to Simba
2. Verify file format matches Postman format
3. Check column names match variable names in scripts
```

---

## Feature Comparison Table

| Feature | Postman | Simba | Notes |
|---------|---------|-------|-------|
| REST API | ✅ | ✅ | Identical |
| GraphQL | ✅ | ✅ | Simba has better introspection |
| WebSocket | ✅ | ✅ | Similar |
| Pre-request Scripts | ✅ | ✅ | JavaScript/pm.* API |
| Test Scripts | ✅ | ✅ | Chai assertions |
| Collection Runner | ✅ | ✅ | Similar workflow |
| Data-driven Testing | ✅ | ✅ | CSV/JSON support |
| Environments | ✅ | ✅ | Identical concept |
| Team Workspaces | ✅ | ✅ | Simba is self-hosted |
| Import/Export | ✅ | ✅ | Postman v2.1 format |
| Monitors | ✅ | ⏳ | Use CI/CD instead |
| Mock Servers | ✅ | ⏳ | Planned |
| API Documentation | ✅ | ⏳ | Planned |
| Newman CLI | ✅ | ✅ | Newman works with Simba exports |

---

## Bulk Migration Script

For migrating many collections at once:

```bash
#!/bin/bash
# migrate-from-postman.sh

SIMBA_API="http://localhost:5000/api"
WORKSPACE_ID="your-workspace-id"
TOKEN="your-auth-token"

for file in ./postman-exports/*.json; do
    echo "Importing: $file"
    
    curl -X POST "$SIMBA_API/collections/import" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d @"$file" \
      --data-urlencode "workspaceId=$WORKSPACE_ID"
    
    echo ""
done

echo "✅ Migration complete!"
```

---

## Getting Help

**Migration Issues?**
- [Troubleshooting Guide](../reference/troubleshooting.md)
- [FAQ](../reference/faq.md)
- [GitHub Issues](https://github.com/skckadiyala/APITestingTool/issues)

**Need Assistance?**
- Email: support@cdw.com
- Community: [Discussions](https://github.com/skckadiyala/APITestingTool/discussions)

---

## Next Steps

After successful migration:
1. ✅ [Set up CI/CD](../tutorials/cicd-integration.md)
2. ✅ [Configure team permissions](../collaboration/permissions.md)
3. ✅ [Explore advanced features](../advanced/pre-request-scripts.md)

---

*Last updated: April 15, 2026*
