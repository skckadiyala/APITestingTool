# Simba Documentation

This directory contains the complete user documentation for Simba API Testing Tool, built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

## Quick Start

### Install MkDocs

```bash
# Option 1: Install with pinned versions (recommended)
pip install -r docs-requirements.txt

# Option 2: Install manually
pip install mkdocs-material
pip install mkdocs-awesome-pages-plugin

# Note: We pin to MkDocs 1.x to avoid 2.0 breaking changes
```

### Preview Documentation

```bash
# From the project root directory
mkdocs serve

# Open http://localhost:8000 in your browser
```

### Build Documentation

```bash
# Generate static HTML site
mkdocs build

# Output will be in site/ directory
```

### Deploy to GitHub Pages

```bash
# Deploy to gh-pages branch
mkdocs gh-deploy
```

## Documentation Structure

```
docs/
├── index.md                              # Home page
├── getting-started/                      # Getting started guides
│   ├── installation.md                   # Installation instructions
│   ├── first-request.md                  # First request tutorial
│   ├── interface-tour.md                 # UI overview
│   ├── quick-start.md                    # Quick start guide
│   └── overview.md                       # What is Simba
├── concepts/                             # Core concepts
│   ├── workspaces.md                     # Workspaces explained
│   ├── collections.md                    # Collections explained
│   ├── requests.md                       # Requests explained
│   ├── environments.md                   # Environments explained
│   └── variables.md                      # Variables explained
├── requests/                             # Making requests
│   ├── rest/                             # REST API
│   │   ├── get-requests.md
│   │   ├── post-requests.md
│   │   ├── put-patch.md
│   │   ├── delete-requests.md
│   │   ├── headers.md
│   │   ├── query-params.md
│   │   └── request-body.md
│   ├── graphql/                          # GraphQL
│   │   ├── overview.md
│   │   ├── queries.md
│   │   ├── mutations.md
│   │   ├── variables.md
│   │   └── schema-explorer.md
│   └── websocket/                        # WebSocket
│       ├── connecting.md
│       └── messages.md
├── auth/                                 # Authentication
│   ├── overview.md
│   ├── bearer-token.md
│   ├── basic-auth.md
│   ├── api-key.md
│   └── oauth2.md
├── advanced/                             # Advanced features
│   ├── pre-request-scripts.md
│   ├── test-scripts.md
│   ├── collection-runner.md
│   ├── data-driven-testing.md
│   └── request-history.md
├── collaboration/                        # Team features
│   ├── workspace-sharing.md
│   ├── permissions.md
│   └── import-export.md
├── tutorials/                            # Step-by-step tutorials
│   ├── rest-api-testing.md
│   ├── graphql-testing.md
│   ├── oauth-flow.md
│   ├── automated-testing.md
│   └── cicd-integration.md
├── reference/                            # Reference documentation
│   ├── scripting-api.md                  # Complete scripting API
│   ├── variable-syntax.md
│   ├── keyboard-shortcuts.md
│   ├── error-messages.md
│   ├── troubleshooting.md
│   └── faq.md
├── about/                                # About
│   ├── changelog.md
│   ├── migration-postman.md
│   ├── contributing.md
│   └── license.md
└── assets/                               # Images, screenshots
    └── screenshots/                      # UI screenshots
```

## Adding New Pages

1. **Create Markdown file**
   ```bash
   touch docs/new-section/new-page.md
   ```

2. **Add to navigation** in `mkdocs.yml`:
   ```yaml
   nav:
     - New Section:
       - New Page: new-section/new-page.md
   ```

3. **Preview your changes**:
   ```bash
   mkdocs serve
   ```

## Writing Guidelines

### Use Admonitions

```markdown
!!! note \"Important Note\"
    This is an important note for users.

!!! tip \"Pro Tip\"
    This helps users work more efficiently.

!!! warning \"Warning\"
    This warns users about potential issues.

!!! danger \"Danger\"
    This highlights dangerous actions.
```

### Use Code Tabs

```markdown
=== \"JavaScript\"
    ```javascript
    const data = pm.response.json();
    ```

=== \"Python\"
    ```python
    data = response.json()
    ```
```

### Add Screenshots

```markdown
![Alt text](../assets/screenshots/image-name.png)
*Caption for the screenshot*
```

### Link to Other Pages

```markdown
[Link text](../other-section/other-page.md)
[Link with anchor](page.md#section-heading)
```

## Adding Screenshots

1. **Take screenshots** of the Simba UI
2. **Save** to `docs/assets/screenshots/`
3. **Optimize** images (use PNG for UI, JPEG for photos)
4. **Reference** in markdown:
   ```markdown
   ![Description](../assets/screenshots/filename.png)
   ```

### Recommended Tools
- **macOS**: Cmd+Shift+4 (built-in)
- **Windows**: Win+Shift+S (Snipping Tool)
- **Cross-platform**: [ShareX](https://getsharex.com/), [Flameshot](https://flameshot.org/)

### Screenshot Naming Convention
```
{feature}-{action}-{state}.png

Examples:
- workspace-create-dialog.png
- request-builder-get-method.png
- response-viewer-json-body.png
- test-results-passing.png
```

## Content Status

**Overall Progress:** 28/45 pages complete (62%)

### ✅ Completed (28 pages)

**Getting Started (5/5)**
- ✅ Home page with overview
- ✅ Installation guide (comprehensive)
- ✅ First request tutorial
- ✅ Interface tour
- ✅ Quick start guide

**Core Concepts (5/5)**
- ✅ Workspaces explained
- ✅ Collections explained
- ✅ Requests explained
- ✅ Environments explained
- ✅ Variables explained

**REST API (2/7)**
- ✅ GET requests
- ✅ POST requests

**Authentication (4/4) 🎯 COMPLETE**
- ✅ Bearer token authentication
- ✅ Basic authentication
- ✅ API key authentication
- ✅ OAuth 2.0 authentication

**Advanced Features (5/5) 🎯 COMPLETE**
- ✅ Pre-request scripts
- ✅ Test scripts
- ✅ Collection Runner
- ✅ Data-driven testing
- ✅ Request history

**Collaboration (3/3) 🎯 COMPLETE**
- ✅ Workspace sharing
- ✅ Permissions & roles
- ✅ Import/Export collections

**Tutorials (5/5) 🎯 COMPLETE**
- ✅ REST API testing tutorial
- ✅ GraphQL testing tutorial
- ✅ OAuth flow tutorial
- ✅ Automated testing tutorial
- ✅ Azure DevOps CI/CD integration

**Reference (1/6)**
- ✅ Scripting API reference (complete, comprehensive)

**Infrastructure**
- ✅ MkDocs Material configuration
- ✅ Logo integration (Simba.png)
- ✅ Documentation README

### 📝 Todo (17 pages)

**REST API (5 pages)**
- PUT/PATCH requests
- DELETE requests
- Headers management
- Query parameters
- Request body formats

**GraphQL (5 pages)**
- GraphQL overview
- Queries in depth
- Mutations in depth
- Variables usage
- Schema explorer

**WebSocket (2 pages)**
- Connecting to WebSocket
- Sending/receiving messages

**Reference (5 pages)**
- Variable syntax reference
- Keyboard shortcuts
- Error messages reference
- Troubleshooting guide
- FAQ

**About (4 pages)**
- Changelog
- Migration from Postman
- Contributing guidelines
- License

**Screenshots (50+)**
- UI screenshots for all features
- Tutorial step-by-step visuals
- Error state examples

## Contributing

### Before Writing

1. Check existing pages to avoid duplication
2. Follow the structure above
3. Use admonitions and tabs for better UX
4. Add code examples where appropriate
5. Include screenshots for UI-related docs

### Adding Examples

Always include:
- ✅ Real, working code examples
- ✅ Expected output/response
- ✅ Common errors and solutions
- ✅ Links to related documentation

### Review Checklist

- [ ] Content is accurate and up-to-date
- [ ] Code examples work
- [ ] Screenshots are clear and labeled
- [ ] Links are not broken
- [ ] Spelling and grammar checked
- [ ] Follows documentation structure
- [ ] Mobile-friendly (test with `mkdocs serve`)

## Deployment

### GitHub Pages

```bash
# One-time setup
git checkout -b gh-pages

# Deploy updates
mkdocs gh-deploy
```

### Custom Server

```bash
# Build static site
mkdocs build

# Copy site/ directory to web server
scp -r site/* user@server:/var/www/docs/
```

### Docker

```dockerfile
FROM squidfunk/mkdocs-material
COPY . /docs
EXPOSE 8000
CMD [\"serve\", \"--dev-addr=0.0.0.0:8000\"]
```

## Useful Resources

- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Simba GitHub Repo](https://github.com/skckadiyala/APITestingTool)

## Support

For documentation issues or questions:
- Open an issue on GitHub
- Email: support@cdw.com
- Contribute via Pull Request

## License

Documentation is licensed under [MIT License](../LICENSE).
