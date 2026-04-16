# Import and Export

Share collections with team members, backup your work, or migrate from other API testing tools like Postman. Simba supports industry-standard formats for seamless collaboration.

---

## Overview

**Why Import/Export?**

- **Backup**: Create local copies of collections
- **Share**: Send collections to external teams
- **Migrate**: Move from Postman to Simba
- **Version control**: Track collection changes over time
- **Collaborate**: Share with teams not in workspace
- **Archive**: Preserve collections for compliance

**Supported formats:**
- Simba JSON (native format)
- Postman Collection v2.1 (import/export)
- OpenAPI 3.0 (import - coming soon)

---

## Exporting Collections

### Export Single Collection

![Export Collection](../assets/screenshots/export-collection.png)

1. Navigate to collection you want to export
2. Click **collection name** → **"⋮" menu** (three dots)
3. Select **"Export"**
4. Choose export format:
   ```
   ○ Simba JSON (recommended)
   ○ Postman Collection v2.1
   ```
5. Choose export options:
   ```
   ☑ Include environment variables
   ☑ Include pre-request scripts
   ☑ Include test scripts
   ☑ Include request history
   ```
6. Click **"Export"**
7. Save file: `Backend_API_Collection.json`

**Export includes:**
- All folders and requests in collection
- Request configurations (URL, method, headers, body, auth)
- Pre-request and test scripts
- Collection variables
- Folder structure

### Export Multiple Collections

1. Go to **Workspace** → **"Collections"** tab
2. **Select collections** (checkbox next to each)
   ```
   ☑ User Management
   ☑ Order Management  
   ☑ Payment Processing
   ```
3. Click **"Export Selected"** button
4. Choose format: **Simba JSON** or **Postman Collection v2.1**
5. Click **"Export"**
6. Save file: `Workspace_Collections.zip` (contains 3 .json files)

### Export Entire Workspace

**Backup everything:**
```
Workspace Settings → Export tab

Export Workspace "Backend API Team":
  ☑ All collections (12)
  ☑ All environments (3)
  ☑ Request history (last 30 days)
  ☑ Data files (5)
  ☑ Workspace settings

[Export Workspace]
```

**Downloaded file:** `Backend_API_Team_Workspace_2024-03-15.zip`

**Contents:**
```
Backend_API_Team_Workspace_2024-03-15.zip
├── collections/
│   ├── user_management.json
│   ├── order_management.json
│   └── payment_processing.json
├── environments/
│   ├── development.json
│   ├── staging.json
│   └── production.json
├── data-files/
│   ├── test_users.csv
│   └── payment_scenarios.json
└── workspace_metadata.json
```

---

## Importing Collections

### Import from Simba JSON

![Import Collection](../assets/screenshots/import-collection.png)

1. Click **"+ New"** dropdown in sidebar
2. Select **"Import"**
3. Choose import method:
   ```
   ○ Upload file
   ○ Paste JSON
   ○ Import from URL
   ```

**Option 1: Upload File**
```
1. Click "Choose File"
2. Select: Backend_API_Collection.json
3. Preview:
   Collection: Backend API
   Requests: 25
   Folders: 5
   Scripts: 12
4. Click "Import"
5. Success: "Collection imported successfully"
```

**Option 2: Paste JSON**
```
1. Click "Paste JSON" tab
2. Paste collection JSON:
   {
     "info": {
       "name": "Backend API",
       "schema": "https://schema.simba.com/json/collection/v1.0.0/"
     },
     "item": [...]
   }
3. Click "Import"
```

**Option 3: Import from URL**
```
1. Click "Import from URL" tab
2. Enter URL: https://example.com/api/collection.json
3. Click "Fetch"
4. Preview collection
5. Click "Import"
```

### Import from Postman

**Step 1: Export from Postman**
```
Postman → Collection → Settings → Export
Format: Collection v2.1 (recommended)
Save: My_Postman_Collection.json
```

**Step 2: Import to Simba**
```
Simba → Import → Upload file → My_Postman_Collection.json

Import Options:
  ☑ Convert Postman scripts to Simba format
  ☑ Import collection variables
  ☑ Import auth configuration
  ☑ Import pre-request scripts
  ☑ Import test scripts

[Import]
```

**Step 3: Review migration**
```
✅ Imported: 30 requests
✅ Converted: 12 pre-request scripts
✅ Converted: 15 test scripts
⚠️  Manual review needed: 3 scripts (unsupported Postman features)

[View Migration Report]
```

**Migration report:**
```
Successful conversions:
  ✅ pm.environment.get/set → Supported
  ✅ pm.test() → Supported
  ✅ pm.expect() assertions → Supported
  ✅ pm.response.json() → Supported

Manual review required:
  ⚠️  Request 5: pm.sendRequest() → Use pre-request script workaround
  ⚠️  Request 12: Postman visualizer → Not supported yet
  ⚠️  Request 18: pm.collectionVariables.replaceIn() → Use {{var}} syntax
```

### Merge vs. Replace

**When importing to existing workspace:**

**Replace (overwrite):**
```
⚠️  Warning: Existing collection "User Management" will be replaced.
   All current requests and folders will be deleted.

○ Replace existing collection
○ Import as new collection (recommended)
```

**Import as new:**
```
Existing: "User Management"
Imported: "User Management (1)"  ← New collection created

Both collections coexist, compare and merge manually.
```

**Recommendation:** Always import as new, review, then manually delete old collection

---

## Sharing Collections

### Scenario 1: Share with External Team (No Simba Account)

**Use case:** External partner needs API examples

**Method 1: Export and Email**
```
1. Export collection → Simba JSON format
2. Email: Backend_API_Collection.json attachment
3. Recipient imports into their Simba workspace
```

**Method 2: Public link (sharing feature)**
```
Collection → Share → Generate public link

Public Link:
  https://simba.app/shared/abc123

Settings:
  ○ View only (read-only)
  ○ Allow fork (recipient can copy)
  
Expiration:
  ○ Never
  ○ 7 days
  ○ 30 days
  ● Custom: [2024-04-15]

[Generate Link]

Share link: https://simba.app/shared/abc123
  "Anyone with this link can view the collection"
```

**Recipient experience:**
```
1. Open link: https://simba.app/shared/abc123
2. Sees collection in read-only view
3. Can fork to their workspace:
   [Fork to My Workspace]
4. Forked collection is fully editable in their workspace
```

### Scenario 2: Share with Team Members (Within Workspace)

**Already in workspace → No export needed**

Team members see collections automatically:
```
Workspace: Backend API Team

Alice (OWNER):
  ✅ Sees all collections
  ✅ Can edit all collections

Bob (EDITOR):
  ✅ Sees all collections
  ✅ Can edit all collections

Carol (VIEWER):
  ✅ Sees all collections
  ❌ Cannot edit (read-only)
```

**Best practice:** Use workspace sharing, not export/import

### Scenario 3: Share Across Workspaces (Same Organization)

**Use case:** You have two workspaces, want to copy collection between them

**Method: Export and import**
```
Workspace A: Development
  Export collection: "User Management"

Workspace B: Staging
  Import collection: "User Management"
  
Result: Same collection now in both workspaces (independent copies)
```

**Note:** Changes in Workspace A don't sync to Workspace B (use workspace sharing for real-time sync)

---

## Environment Import/Export

### Export Environment

```
Environments tab → Environment name → Export

Export "Development" Environment:
  ☑ Include secret values (encrypted)
  ☐ Export as plain text (not recommended)

[Export]

Saved: Development_Environment.json
```

**Environment JSON structure:**
```json
{
  "name": "Development",
  "values": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "API_KEY",
      "value": "dev_key_12345",
      "enabled": true,
      "type": "secret"
    }
  ]
}
```

### Import Environment

```
Environments tab → Import

Upload: Development_Environment.json

Preview:
  Name: Development
  Variables: 10
  Secrets: 3

Import Options:
  ○ Replace existing "Development" environment
  ● Import as new "Development (1)" environment

[Import]
```

**Security note:** Secret values are encrypted in export, but store exports securely

---

## Version Control Integration

### Manual Git Workflow

**Track collection changes:**

```bash
# Export collections to git repository
cd /path/to/project/api-tests/

# Export collection
# (In Simba: Export collection → Save to api-tests/collections/)

# Commit changes
git add collections/user_management.json
git commit -m "Add user registration endpoint tests"
git push origin main
```

**Collaborate via Git:**
```bash
# Team member pulls changes
git pull origin main

# Import updated collection in Simba
# Simba → Import → collections/user_management.json
```

### Automated Backup Script

**Daily workspace backup:**

```bash
#!/bin/bash
# backup-simba.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="./simba-backups/$DATE"

mkdir -p "$BACKUP_DIR"

# Manually export workspace in Simba
# Save to: $BACKUP_DIR/workspace-export.zip

# Commit to git
git add "simba-backups/$DATE"
git commit -m "Backup: $DATE"
git push origin main

echo "Backup complete: $BACKUP_DIR"
```

**Restore from backup:**
```bash
# Find backup date
ls simba-backups/
  2024-03-01/
  2024-03-05/
  2024-03-10/

# Import from backup
# Simba → Import → simba-backups/2024-03-10/collections/*.json
```

---

## Migration from Postman

### Complete Migration Workflow

**Step 1: Prepare Postman workspace**
```
Postman → Workspaces → Select workspace

Inventory:
  ✓ 5 collections
  ✓ 3 environments
  ✓ 50+ requests
  ✓ Pre-request scripts
  ✓ Test scripts
```

**Step 2: Export from Postman**
```
1. Export each collection:
   Collection → ... → Export → v2.1 → Export

   Files:
   - User_Management.postman_collection.json
   - Order_Management.postman_collection.json
   - Payment_Processing.postman_collection.json
   - Admin_Panel.postman_collection.json
   - Webhooks.postman_collection.json

2. Export each environment:
   Environments → Environment → ... → Export

   Files:
   - Development.postman_environment.json
   - Staging.postman_environment.json
   - Production.postman_environment.json
```

**Step 3: Import to Simba**
```
Simba:
1. Create workspace: "Migrated from Postman"

2. Import collections (one by one):
   Import → Upload file → User_Management.postman_collection.json
   
   ✅ Imported: 15 requests
   ✅ Converted: 5 pre-request scripts
   ✅ Converted: 10 test scripts

   Repeat for all 5 collections

3. Import environments:
   Environments → Import → Development.postman_environment.json
   
   ✅ Imported: Development
   ✅ Variables: 12

   Repeat for all 3 environments
```

**Step 4: Verify and test**
```
1. Open each request, verify configuration:
   ✓ URL correct
   ✓ Headers present
   ✓ Auth configuration imported
   ✓ Body imported

2. Run sample requests:
   ✓ GET /users → 200 OK
   ✓ POST /users → 201 Created

3. Test scripts:
   ✓ Pre-request script executes
   ✓ Test assertions pass
```

**Step 5: Manual adjustments**
```
Review migration report, fix unsupported features:

Request 5: pm.sendRequest() not supported
  Workaround: Use Collection Runner with request chaining

Request 12: Postman visualizer not supported
  Workaround: View response in JSON viewer

Request 18: Collection variable interpolation
  Fix: Change pm.collectionVariables.replaceIn("{{url}}")
       to: Just use {{url}} syntax (native Simba support)
```

### Postman Feature Compatibility

| Postman Feature | Simba Support | Notes |
|----------------|---------------|--------|
| Collections | ✅ Full | Direct import |
| Folders | ✅ Full | Nested folders supported |
| Requests (REST) | ✅ Full | All HTTP methods |
| Environments | ✅ Full | Direct import |
| Pre-request scripts | ✅ Mostly | `pm.sendRequest()` not supported |
| Test scripts | ✅ Mostly | Core assertions supported |
| Collection runner | ✅ Full | Similar functionality |
| Data files | ✅ Full | CSV/JSON support |
| Auth (Bearer, Basic, etc.) | ✅ Full | All auth types |
| Variables | ✅ Full | `{{var}}` syntax |
| Global variables | ✅ Full | Workspace-level vars |
| GraphQL | ✅ Full | Native support |
| WebSocket | 🔄 Partial | In progress |
| Visualizer | ❌ Not yet | Planned feature |
| Postman Flows | ❌ No | Different approach |
| Mock servers | ❌ No | Use actual test servers |
| API monitoring | ❌ No | Use external monitoring tools |

---

## Format Specifications

### Simba JSON Format

**Collection structure:**
```json
{
  "info": {
    "name": "Backend API",
    "description": "Backend microservices testing",
    "schema": "https://schema.simba.com/json/collection/v1.0.0/"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "{{BASE_URL}}",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Users",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/users",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          },
          "event": [
            {
              "listen": "prerequest",
              "script": {
                "exec": [
                  "pm.environment.set('timestamp', Date.now());"
                ]
              }
            },
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is 200', () => {",
                  "  pm.response.to.have.status(200);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Postman Collection v2.1 Format

**Compatible with Postman Collection v2.1 specification:**
```json
{
  "info": {
    "name": "Backend API",
    "_postman_id": "abc-123-def-456",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Users",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/users",
          "host": ["{{baseUrl}}"],
          "path": ["users"]
        }
      }
    }
  ]
}
```

**Simba reads and writes Postman v2.1 for interoperability**

---

## Bulk Operations

### Export All Collections

**Bash script:**
```bash
#!/bin/bash
# export-all-collections.sh

# Export collections one by one in Simba UI
# (Simba doesn't have CLI yet, manual export required)

# Organize exports
mkdir -p exports/collections
mkdir -p exports/environments

echo "Export all collections from Simba to exports/ directory"
echo "Then run this script to organize:"

# Organize files
mv ~/Downloads/*_collection.json exports/collections/
mv ~/Downloads/*_environment.json exports/environments/

echo "Collections exported to exports/"
```

### Import Multiple Collections

**Python script:**
```python
# import-collections.py
import os
import json

collections_dir = "./exports/collections/"

for filename in os.listdir(collections_dir):
    if filename.endswith(".json"):
        filepath = os.path.join(collections_dir, filename)
        
        with open(filepath, 'r') as f:
            collection_data = json.load(f)
        
        # Modify collection before import (if needed)
        # e.g., Update base URL
        for item in collection_data.get('item', []):
            # Process requests
            pass
        
        # Save modified collection
        output_path = f"./modified/{filename}"
        with open(output_path, 'w') as f:
            json.dump(collection_data, f, indent=2)
        
        print(f"Processed: {filename}")

print("Import modified collections manually in Simba")
```

---

## Best Practices

### ✅ DO

**Export regularly:**
```
Weekly: Export workspace → Backup to cloud storage
Monthly: Export with version number (Backend_API_v2.3.json)
Before major changes: Backup current state
```

**Use version control:**
```
✅ Store exports in Git repository
✅ Commit with meaningful messages: "Add payment webhook tests"
✅ Tag releases: git tag v1.0-api-tests
```

**Document collections:**
```
✅ Add collection description
✅ Document variables in collection README
✅ Include example requests
✅ Comment complex scripts
```

**Validate after import:**
```
✅ Send test request to verify configuration
✅ Check environment variables imported correctly
✅ Review pre-request and test scripts
✅ Verify auth configuration
```

### ❌ DON'T

**Don't export secrets to version control:**
```
❌ Git commit: Production_Environment.json (contains API keys)

✅ Alternative: Export without secrets, document separately
   Or: Use encrypted git-crypt for sensitive files
```

**Don't blindly import:**
```
❌ Import → Override existing collection without backup

✅ Always: Import as new, review, then replace old
```

**Don't lose migration reports:**
```
❌ Close Postman migration report without reviewing

✅ Save migration report, address warnings manually
```

**Don't share public links indefinitely:**
```
❌ Generate public link with "Never" expiration

✅ Set expiration (7-30 days), regenerate if needed
```

---

## Troubleshooting

### Import Fails: "Invalid JSON format"

**Cause:** Corrupted or malformed JSON file

**Solutions:**
1. Validate JSON: Paste into [jsonlint.com](https://jsonlint.com)
2. Re-export from source application
3. Check file encoding (should be UTF-8)
4. Remove BOM (Byte Order Mark) if present

### Postman Scripts Not Working After Import

**Cause:** Unsupported Postman API (`pm.sendRequest()`, visualizer, etc.)

**Solutions:**
1. Review migration report
2. Manually rewrite unsupported scripts
3. Use Collection Runner for request chaining (instead of `pm.sendRequest()`)
4. Report feature request if critical functionality missing

### Exported File Too Large

**Cause:** Collection has large request/response history

**Solutions:**
1. Uncheck "Include request history" during export
2. Clear history before export: Collection → Clear History
3. Export collections individually (not entire workspace)
4. Remove unused data files from workspace

### Environment Variables Not Imported

**Cause:** Different environment format or encrypted values

**Solutions:**
1. Export environment separately from collection
2. Manually recreate environment if import fails
3. Check for special characters in variable names (use alphanumeric + underscore)
4. Verify JSON structure matches Simba environment schema

### Collection Imported But Requests Missing

**Cause:** Partial import due to unsupported request types (WebSocket, etc.)

**Solutions:**
1. Check import summary: "25/30 requests imported"
2. Review migration report for skipped items
3. Manually recreate missing requests
4. Report issue if REST/GraphQL requests missing

---

## Related Topics

- [Workspace Sharing](workspace-sharing.md) - Share collections within workspace (real-time sync)
- [Collections](../core-concepts/collections.md) - Organize requests in collections
- [Environments](../core-concepts/environments.md) - Manage environment variables
- [Collection Runner](../advanced/collection-runner.md) - Run exported collections
- [Migration from Postman](../about/migration.md) - Detailed Postman migration guide
