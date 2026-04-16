# Azure DevOps CI/CD Integration Tutorial

Automate API testing with Azure DevOps Pipelines. Learn to run Simba collections in CI/CD, generate test reports, and integrate with pull requests.

---

## Overview

**What you'll learn:**
- Export Simba collections for CI/CD
- Set up Azure DevOps pipeline
- Run collections using Newman or Postman CLI
- Generate HTML test reports
- Integrate tests with pull requests
- Manage test environments securely
- Handle test failures and notifications

**Prerequisites:**
- Azure DevOps account (free tier available)
- Simba test collection ready
- Git repository hosted in Azure Repos
- Basic YAML knowledge

**Time required:** 45 minutes

---

## Part 1: Understanding the Flow

### CI/CD Test Pipeline

```
┌─────────────┐
│ Developer   │
│ pushes code │
└──────┬──────┘
       │
       ├─────> Trigger Pipeline
       │
┌──────▼──────────────────────────────────┐
│   Azure DevOps Pipeline                 │
│                                         │
│  1. Checkout code                       │
│  2. Install Node.js & CLI tools         │
│  3. Export Simba collection             │
│  4. Run tests (Newman/Postman CLI)      │
│  5. Generate HTML report                │
│  6. Publish test results                │
│  7. Fail build if tests fail            │
└──────┬──────────────────────────────────┘
       │
       ├─────> ✅ Tests Pass → Deploy
       │
       └─────> ❌ Tests Fail → Block PR
```

---

## Part 2: Export Simba Collection

### Export Collection for CI/CD

1. **Export collection:**
   ```
   Simba → Collection → Export
   
   Format: Postman Collection v2.1
   Include:
     ☑ Pre-request scripts
     ☑ Test scripts
     ☑ Collection variables (NOT secrets)
       
   Save as: api-tests.postman_collection.json
   ```

2. **Export environment:**
   ```
   Simba → Environment → Export
   
   Environment: CI Environment
   Options:
     ☐ Include secret values (DO NOT include)
     ☑ Export variable keys only
   
   Save as: ci-environment.postman_environment.json
   ```

3. **Add to Git repository:**
   ```bash
   cd /path/to/your/repo
   mkdir tests
   mv api-tests.postman_collection.json tests/
   mv ci-environment.postman_environment.json tests/
   
   git add tests/
   git commit -m "Add API test collection for CI/CD"
   git push origin main
   ```

---

## Part 3: Install Newman CLI (Local Testing)

### Test Locally Before CI/CD

**Install Newman:**
```bash
# Install globally
npm install -g newman
npm install -g newman-reporter-htmlextra

# Verify installation
newman --version
# Output: 6.0.0
```

**Run collection locally:**
```bash
cd tests/

# Basic run
newman run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json

# With environment variables (override secrets)
newman run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json \
  --env-var "apiKey=your-test-api-key" \
  --env-var "baseUrl=https://api-staging.example.com"

# With HTML report
newman run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json \
  -r htmlextra \
  --reporter-htmlextra-export ./newman-report.html
```

**Expected output:**
```
→ API Test Suite
  GET /users
  ✓  Status code is 200
  ✓  Response is an array
  ✓  Users have required fields
  
  POST /users
  ✓  Status code is 201
  ✓  User created successfully
  ✓  Response contains user ID

┌─────────────────────────┬────────────┬────────────┐
│                         │   executed │     failed │
├─────────────────────────┼────────────┼────────────┤
│              iterations │          1 │          0 │
├─────────────────────────┼────────────┼────────────┤
│                requests │         15 │          0 │
├─────────────────────────┼────────────┼────────────┤
│            test-scripts │         30 │          0 │
├─────────────────────────┼────────────┼────────────┤
│      prerequest-scripts │         10 │          0 │
├─────────────────────────┼────────────┼────────────┤
│              assertions │         45 │          0 │
├─────────────────────────┴────────────┴────────────┤
│ total run duration: 3.2s                          │
├───────────────────────────────────────────────────┤
│ total data received: 12.5kB (approx)              │
├───────────────────────────────────────────────────┤
│ average response time: 214ms [min: 89ms, max: 456ms] │
└───────────────────────────────────────────────────┘
```

### Alternative: Test Locally with Postman CLI

**Postman CLI** is the official CLI tool from Postman that provides additional features beyond Newman, including cloud-based test runs and better integration with Postman's ecosystem.

**Install Postman CLI:**
```bash
# Install via npm
npm install -g postman-cli

# Verify installation
postman --version
# Output: 1.3.0

# Login to Postman (optional, for cloud features)
postman login
```

**Run collection locally:**
```bash
cd tests/

# Basic run
postman collection run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json

# With environment variables
postman collection run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json \
  --env-var "apiKey=your-test-api-key" \
  --env-var "baseUrl=https://api-staging.example.com"

# With detailed output
postman collection run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json \
  --verbose

# Run with bail on failure (stop on first error)
postman collection run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json \
  --bail

# Export results to JSON
postman collection run api-tests.postman_collection.json \
  -e ci-environment.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export ./postman-results.json
```

**Expected output:**
```
Postman CLI v1.3.0

→ API Test Suite

→ GET /users
  ✓  Status code is 200
  ✓  Response is an array
  ✓  Users have required fields

→ POST /users
  ✓  Status code is 201
  ✓  User created successfully
  ✓  Response contains user ID

┌─────────────────────────┬────────────┬────────────┐
│                         │   executed │     failed │
├─────────────────────────┼────────────┼────────────┤
│              iterations │          1 │          0 │
├─────────────────────────┼────────────┼────────────┤
│                requests │         15 │          0 │
├─────────────────────────┼────────────┼────────────┤
│            test-scripts │         30 │          0 │
├─────────────────────────┼────────────┼────────────┤
│              assertions │         45 │          0 │
└─────────────────────────┴────────────┴────────────┘

✓ All tests passed!
Total run duration: 3.1s
```

**Postman CLI vs Newman Comparison:**

| Feature | Postman CLI | Newman |
|---------|-------------|--------|
| **Installation** | `npm install -g postman-cli` | `npm install -g newman` |
| **Maintained by** | Postman (official) | Postman (community) |
| **Cloud integration** | ✅ Yes (sync with Postman Cloud) | ❌ No |
| **Local-only execution** | ✅ Yes | ✅ Yes |
| **HTML reports** | ✅ Via reporters | ✅ Via newman-reporter-htmlextra |
| **JSON reports** | ✅ Built-in | ✅ Built-in |
| **CI/CD integration** | ✅ Yes | ✅ Yes |
| **Run collections from cloud** | ✅ Yes | ❌ No |
| **Advanced features** | ✅ More features | ✅ Basic features |
| **Maturity** | 🆕 Newer | ✅ Well-established |

**When to use Postman CLI:**
- ✅ You want official Postman support and latest features
- ✅ You use Postman Cloud and want to sync collections
- ✅ You need advanced reporting and monitoring features
- ✅ You prefer modern CLI experience

**When to use Newman:**
- ✅ You want a lightweight, proven solution
- ✅ You need extensive community plugins and reporters
- ✅ You have existing Newman scripts and workflows
- ✅ You don't need cloud integration

> 💡 **Best Practice:** Both tools are compatible with Postman/Simba collections. Choose based on your team's needs. Many teams use Newman for its maturity and extensive reporter ecosystem.

---

## Part 4: Create Azure Pipeline

### Basic Pipeline YAML

**Create file: `azure-pipelines.yml` in repo root**

```yaml
# API Testing Pipeline
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - 'src/**'
      - 'tests/**'

pool:
  vmImage: 'ubuntu-latest'

variables:
  # Non-secret variables
  API_BASE_URL: 'https://jsonplaceholder.typicode.com'
  TEST_TIMEOUT: '5000'

steps:
# Step 1: Checkout code
- checkout: self
  displayName: 'Checkout repository'

# Step 2: Install Node.js
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

# Step 3: Install Newman
- script: |
    npm install -g newman
    npm install -g newman-reporter-htmlextra
  displayName: 'Install Newman CLI'

# Step 4: Run API Tests
- script: |
    newman run tests/api-tests.postman_collection.json \
      -e tests/ci-environment.postman_environment.json \
      --env-var "baseUrl=$(API_BASE_URL)" \
      --timeout-request $(TEST_TIMEOUT) \
      -r cli,htmlextra,junit \
      --reporter-htmlextra-export $(Build.ArtifactStagingDirectory)/newman-report.html \
      --reporter-junit-export $(Build.ArtifactStagingDirectory)/newman-report.xml
  displayName: 'Run API Tests with Newman'
  continueOnError: false

# Step 5: Publish Test Results
- task: PublishTestResults@2
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '$(Build.ArtifactStagingDirectory)/newman-report.xml'
    failTaskOnFailedTests: true
    testRunTitle: 'API Test Results'
  displayName: 'Publish test results'
  condition: always()

# Step 6: Publish HTML Report
- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(Build.ArtifactStagingDirectory)/newman-report.html'
    ArtifactName: 'newman-report'
    publishLocation: 'Container'
  displayName: 'Publish HTML Report'
  condition: always()
```

### Commit Pipeline

```bash
git add azure-pipelines.yml
git commit -m "Add Azure DevOps CI/CD pipeline for API tests"
git push origin main
```

### Alternative: Pipeline with Postman CLI

If you prefer to use **Postman CLI** instead of Newman, here's the alternative YAML configuration:

```yaml
# API Testing Pipeline (Postman CLI)
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - 'src/**'
      - 'tests/**'

pool:
  vmImage: 'ubuntu-latest'

variables:
  # Non-secret variables
  API_BASE_URL: 'https://jsonplaceholder.typicode.com'
  TEST_TIMEOUT: '5000'

steps:
# Step 1: Checkout code
- checkout: self
  displayName: 'Checkout repository'

# Step 2: Install Node.js
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

# Step 3: Install Postman CLI
- script: |
    npm install -g postman-cli
  displayName: 'Install Postman CLI'

# Step 4: Run API Tests with Postman CLI
- script: |
    postman collection run tests/api-tests.postman_collection.json \
      -e tests/ci-environment.postman_environment.json \
      --env-var "baseUrl=$(API_BASE_URL)" \
      --timeout-request $(TEST_TIMEOUT) \
      --reporters cli,json \
      --reporter-json-export $(Build.ArtifactStagingDirectory)/postman-results.json \
      --bail
  displayName: 'Run API Tests with Postman CLI'
  continueOnError: false

# Step 5: Publish Test Results (JSON)
- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(Build.ArtifactStagingDirectory)/postman-results.json'
    ArtifactName: 'postman-test-results'
    publishLocation: 'Container'
  displayName: 'Publish Test Results JSON'
  condition: always()

# Step 6: Parse and Display Results
- script: |
    echo "Test Results Summary:"
    cat $(Build.ArtifactStagingDirectory)/postman-results.json | jq '.run.stats'
  displayName: 'Display Test Summary'
  condition: always()
```

**Key Differences from Newman Pipeline:**

| Aspect | Newman Pipeline | Postman CLI Pipeline |
|--------|-----------------|---------------------|
| **Installation** | `npm install -g newman newman-reporter-htmlextra` | `npm install -g postman-cli` |
| **Run command** | `newman run ...` | `postman collection run ...` |
| **HTML reporter** | ✅ Built-in via htmlextra | ⚠️ Requires additional setup |
| **JUnit reporter** | ✅ Built-in | ⚠️ JSON output (convert manually) |
| **JSON output** | ✅ Available | ✅ Native support |
| **Bail on error** | `--bail` | `--bail` |

> 💡 **Recommendation:** For Azure DevOps pipelines, **Newman** is currently the better choice due to its mature JUnit reporter integration with Azure's test results visualization. Use Postman CLI if you need cloud features or advanced Postman-specific functionality.

---

## Part 5: Configure Azure DevOps

### Create Pipeline in Azure DevOps

1. **Navigate to Azure DevOps:**
   ```
   https://dev.azure.com/{your-organization}/{your-project}
   ```

2. **Create new pipeline:**
   ```
   Pipelines → New Pipeline
   
   Where is your code?
     ○ Azure Repos Git
     ○ GitHub
     ● Azure Repos (Select your repository)
   
   Configure your pipeline:
     ○ Starter pipeline
     ● Existing Azure Pipelines YAML file
     
   Select: /azure-pipelines.yml
   
   [Run]
   ```

3. **First run:**
   ```
   Pipeline runs automatically
   
   Status: Running...
   
   Steps:
     ✅ Checkout repository (5s)
     ✅ Install Node.js (12s)
     ✅ Install Newman CLI (8s)
     ✅ Run API Tests with Newman (15s)
       → 45/45 assertions passed
     ✅ Publish test results (2s)
     ✅ Publish HTML Report (1s)
   
   Overall: ✅ Succeeded
   Duration: 43 seconds
   ```

---

## Part 6: Manage Secrets with Azure Key Vault

### Store API Keys Securely

**Option 1: Pipeline Variables (Simple)**

```
Azure DevOps → Pipelines → Edit → Variables

Add variables:
  Name: API_KEY
  Value: your-secret-api-key-here
  ☑ Keep this value secret

  Name: DB_CONNECTION_STRING
  Value: server=...;database=...
  ☑ Keep this value secret
```

**Update YAML to use secrets:**
```yaml
variables:
  # Non-secret variables
  API_BASE_URL: 'https://api.example.com'

steps:
- script: |
    newman run tests/api-tests.postman_collection.json \
      -e tests/ci-environment.postman_environment.json \
      --env-var "baseUrl=$(API_BASE_URL)" \
      --env-var "apiKey=$(API_KEY)" \
      --env-var "dbConnectionString=$(DB_CONNECTION_STRING)"
  displayName: 'Run API Tests'
  env:
    API_KEY: $(API_KEY)
    DB_CONNECTION_STRING: $(DB_CONNECTION_STRING)
```

**Option 2: Azure Key Vault (Production)**

```yaml
# Add Key Vault task
steps:
- task: AzureKeyVault@2
  inputs:
    azureSubscription: 'Your-Azure-Subscription'
    KeyVaultName: 'your-keyvault-name'
    SecretsFilter: 'api-key,db-connection-string'
    RunAsPreJob: true
  displayName: 'Fetch secrets from Key Vault'

# Use secrets in Newman
- script: |
    newman run tests/api-tests.postman_collection.json \
      --env-var "apiKey=$(api-key)" \
      --env-var "dbConnectionString=$(db-connection-string)"
  displayName: 'Run API Tests'
```

---

## Part 7: Multi-Environment Testing

### Test Against Multiple Environments

**Define environment-specific pipelines:**

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop
      - 'feature/*'

stages:
# Stage 1: Test against Development
- stage: TestDevelopment
  displayName: 'Test Development Environment'
  condition: or(eq(variables['Build.SourceBranch'], 'refs/heads/develop'), startsWith(variables['Build.SourceBranch'], 'refs/heads/feature/'))
  jobs:
  - job: RunDevTests
    pool:
      vmImage: 'ubuntu-latest'
    variables:
      API_BASE_URL: 'https://api-dev.example.com'
    steps:
    - template: templates/run-tests.yml
      parameters:
        environment: 'Development'
        baseUrl: $(API_BASE_URL)

# Stage 2: Test against Staging
- stage: TestStaging
  displayName: 'Test Staging Environment'
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
  dependsOn: TestDevelopment
  jobs:
  - job: RunStagingTests
    pool:
      vmImage: 'ubuntu-latest'
    variables:
      API_BASE_URL: 'https://api-staging.example.com'
    steps:
    - template: templates/run-tests.yml
      parameters:
        environment: 'Staging'
        baseUrl: $(API_BASE_URL)

# Stage 3: Test against Production (smoke tests only)
- stage: TestProduction
  displayName: 'Smoke Test Production'
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
  dependsOn: TestStaging
  jobs:
  - job: RunProdSmokeTests
    pool:
      vmImage: 'ubuntu-latest'
    variables:
      API_BASE_URL: 'https://api.example.com'
    steps:
    - script: |
        newman run tests/smoke-tests.postman_collection.json \
          --env-var "baseUrl=$(API_BASE_URL)"
      displayName: 'Run Production Smoke Tests'
```

**Template file: `templates/run-tests.yml`**

```yaml
# Reusable test template
parameters:
- name: environment
  type: string
- name: baseUrl
  type: string

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install -g newman newman-reporter-htmlextra
  displayName: 'Install Newman'

- script: |
    newman run tests/api-tests.postman_collection.json \
      -e tests/ci-environment.postman_environment.json \
      --env-var "baseUrl=${{ parameters.baseUrl }}" \
      -r cli,htmlextra,junit \
      --reporter-htmlextra-export $(Build.ArtifactStagingDirectory)/${{ parameters.environment }}-report.html \
      --reporter-junit-export $(Build.ArtifactStagingDirectory)/${{ parameters.environment }}-report.xml
  displayName: 'Run Tests - ${{ parameters.environment }}'

- task: PublishTestResults@2
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '$(Build.ArtifactStagingDirectory)/${{ parameters.environment }}-report.xml'
    testRunTitle: 'API Tests - ${{ parameters.environment }}'
  condition: always()
```

---

## Part 8: Pull Request Integration

### Require Tests Before Merge

**Branch policies:**

```
Azure DevOps → Project Settings → Repositories → Your Repo → Policies

Branch: main

Build Validation:
  ☑ Require a successful build before merging
  
  Build pipeline: API Test Pipeline
  Path filter: (leave empty to run on all changes)
  
  ☑ Build expiration: Immediately when main is updated
  
Policy requirement:
  ● Required
  
[Save]
```

**Pull Request Flow:**

```
1. Developer creates feature branch
   git checkout -b feature/new-api-endpoint

2. Developer makes changes, commits
   git add .
   git commit -m "Add new user endpoint"
   git push origin feature/new-api-endpoint

3. Developer creates Pull Request
   Azure DevOps → Repos → Pull Requests → New Pull Request
   
   Source: feature/new-api-endpoint
   Target: main
   
   [Create]

4. Pipeline automatically triggered
   Status: Running... ⏳
   
5a. Tests Pass ✅
    → Reviewer can approve
    → PR can be merged

5b. Tests Fail ❌
    → PR blocked from merging
    → Pipeline shows: 3 assertions failed
    → Developer fixes, pushes again
    → Pipeline re-runs automatically
```

**Pull Request Comment (from pipeline):**

```
API Test Results

✅ 42 tests passed
❌ 3 tests failed

Failed tests:
  • POST /users - Status code is 201 (actual: 500)
  • GET /users/:id - User has email field (field missing)
  • DELETE /users/:id - Delete successful (actual: 403)

View detailed report: [newman-report.html]

Build: Failed | Duration: 45s
```

---

## Part 9: Scheduled Test Runs

### Nightly Regression Tests

**Add schedule trigger:**

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main

# Schedule: Run every night at 2 AM UTC
schedules:
- cron: "0 2 * * *"
  displayName: Nightly regression tests
  branches:
    include:
      - main
  always: true

pool:
  vmImage: 'ubuntu-latest'

steps:
# ... (same steps as before)

# Additional: Send email notification if scheduled run fails
- task: SendEmail@1
  inputs:
    To: 'team@example.com'
    Subject: '❌ Nightly API Tests Failed'
    Body: |
      The nightly API regression tests have failed.
      
      Build: $(Build.BuildNumber)
      Branch: $(Build.SourceBranch)
      
      View details: $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)
  condition: and(failed(), eq(variables['Build.Reason'], 'Schedule'))
  displayName: 'Send failure notification'
```

---

## Part 10: Advanced Features

### Parallel Test Execution

**Run different test suites in parallel:**

```yaml
jobs:
# Job 1: Unit Tests
- job: UnitTests
  displayName: 'Run Unit Tests'
  pool:
    vmImage: 'ubuntu-latest'
  steps:
  - script: |
      newman run tests/unit-tests.postman_collection.json
    displayName: 'Unit Tests'

# Job 2: Integration Tests (runs in parallel with Job 1)
- job: IntegrationTests
  displayName: 'Run Integration Tests'
  pool:
    vmImage: 'ubuntu-latest'
  steps:
  - script: |
      newman run tests/integration-tests.postman_collection.json
    displayName: 'Integration Tests'

# Job 3: E2E Tests (runs after both Unit and Integration)
- job: E2ETests
  displayName: 'Run E2E Tests'
  dependsOn:
    - UnitTests
    - IntegrationTests
  pool:
    vmImage: 'ubuntu-latest'
  steps:
  - script: |
      newman run tests/e2e-tests.postman_collection.json
    displayName: 'E2E Tests'
```

### Performance Testing in CI

**Add performance benchmarks:**

```yaml
- script: |
    newman run tests/api-tests.postman_collection.json \
      --env-var "baseUrl=$(API_BASE_URL)" \
      --timeout-request 2000 \
      --bail \
      -r cli
  displayName: 'Run Tests with Performance Checks'
  continueOnError: false

# Collection test script includes performance assertions:
# pm.test("Response time under 500ms", () => {
#     pm.expect(pm.response.time).to.be.below(500);
# });
```

### Test Result Trends

**Azure DevOps automatically tracks:**
- Test pass/fail rate over time
- Response time trends
- Failure patterns

**View trends:**
```
Azure DevOps → Pipelines → Your Pipeline → Analytics → Test Analytics

Charts:
  📊 Test pass percentage (last 30 days)
  📊 Test duration trend
  📊 Failed test distribution
  📊 Flaky test detection
```

---

## Part 11: Troubleshooting CI/CD Issues

### Common Issues

**Issue 1: Newman not found**
```yaml
# Solution: Ensure Newman is installed before running
- script: |
    npm install -g newman
    which newman  # Verify installation
  displayName: 'Install and verify Newman'
```

**Issue 2: Collection file not found**
```bash
# Check paths in pipeline
- script: |
    ls -la tests/
    cat tests/ci-environment.postman_environment.json
  displayName: 'Debug - List test files'
```

**Issue 3: Environment variables not set**
```yaml
# Solution: Explicitly pass variables
- script: |
    echo "Base URL: $(API_BASE_URL)"
    newman run tests/api-tests.postman_collection.json \
      --env-var "baseUrl=$(API_BASE_URL)"
  displayName: 'Run tests with explicit env vars'
```

**Issue 4: Tests pass locally but fail in CI**
```yaml
# Add debug logging in collection
pm.test("Debug environment", () => {
    console.log('BASE_URL:', pm.environment.get('baseUrl'));
    console.log('API_KEY:', pm.environment.get('apiKey') ? 'Set' : 'Not set');
    pm.expect(true).to.be.true; // Always pass, just for logging
});
```

---

## Complete Pipeline Example

**Full `azure-pipelines.yml` with all features:**

```yaml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - 'src/**'
      - 'tests/**'

pr:
  branches:
    include:
      - main

schedules:
- cron: "0 2 * * *"
  displayName: Nightly regression
  branches:
    include:
      - main
  always: true

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: api-test-secrets  # Variable group with secrets
  - name: API_BASE_URL
    value: 'https://jsonplaceholder.typicode.com'
  - name: TEST_TIMEOUT
    value: '5000'

stages:
- stage: Test
  displayName: 'API Testing'
  jobs:
  - job: RunTests
    displayName: 'Run API Tests'
    steps:
    
    # Setup
    - checkout: self
      displayName: 'Checkout code'
    
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
      displayName: 'Install Node.js'
    
    - script: |
        npm install -g newman newman-reporter-htmlextra
      displayName: 'Install Newman'
    
    # Run Tests
    - script: |
        newman run tests/api-tests.postman_collection.json \
          -e tests/ci-environment.postman_environment.json \
          --env-var "baseUrl=$(API_BASE_URL)" \
          --env-var "apiKey=$(API_KEY)" \
          --timeout-request $(TEST_TIMEOUT) \
          --bail \
          -r cli,htmlextra,junit \
          --reporter-htmlextra-export $(Build.ArtifactStagingDirectory)/newman-report.html \
          --reporter-junit-export $(Build.ArtifactStagingDirectory)/newman-report.xml
      displayName: 'Run API Tests'
      continueOnError: false
      env:
        API_KEY: $(API_KEY)
    
    # Publish Results
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '$(Build.ArtifactStagingDirectory)/newman-report.xml'
        failTaskOnFailedTests: true
        testRunTitle: 'API Integration Tests'
      displayName: 'Publish test results'
      condition: always()
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)/newman-report.html'
        ArtifactName: 'test-report'
        publishLocation: 'Container'
      displayName: 'Publish HTML report'
      condition: always()
    
    # Notifications
    - task: SendEmail@1
      inputs:
        To: 'team@example.com'
        Subject: '❌ API Tests Failed - Build $(Build.BuildNumber)'
        Body: 'View report: $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)'
      condition: failed()
      displayName: 'Send failure notification'
```

---

## Best Practices

### ✅ DO

**Keep secrets in Azure Key Vault:**
```
✅ Store API keys, connection strings in Key Vault
✅ Reference secrets via pipeline variables
❌ Never hardcode secrets in collections or YAML
```

**Test locally before committing:**
```bash
# Always test Newman command locally first
newman run tests/api-tests.postman_collection.json
```

**Use descriptive names:**
```yaml
✅ displayName: 'Run API Integration Tests'
❌ displayName: 'Step 4'
```

**Fail fast:**
```yaml
# Stop pipeline immediately if tests fail
--bail
continueOnError: false
failTaskOnFailedTests: true
```

### ❌ DON'T

**Don't run destructive tests in CI:**
```javascript
// ❌ Don't delete production data
// ✅ Use test/staging environment only
```

**Don't ignore flaky tests:**
```
✅ Fix flaky tests immediately
❌ Don't add "continueOnError: true" to hide them
```

---

## Next Steps

**Enhance CI/CD:**
1. Add more environments (UAT, Pre-prod)
2. Implement smoke tests for production
3. Add performance testing with k6 or Artillery
4. Set up test coverage tracking

**Production readiness:**
1. Configure Azure Monitor alerts
2. Integrate with Slack/Teams for notifications
3. Set up test result dashboards
4. Document runbook for test failures

---

## Related Topics

- [Automated Testing](automated-testing.md) - Build test collections
- [Collection Runner](../advanced/collection-runner.md) - Local test execution
- [Environments](../core-concepts/environments.md) - Manage test environments
- [Test Scripts](../advanced/test-scripts.md) - Write effective tests
- [REST API Testing](rest-api-testing.md) - API testing fundamentals
