# GraphQL Testing Tutorial

Learn to test GraphQL APIs with Simba, including queries, mutations, variables, and schema introspection. Use GitHub's GraphQL API for real-world examples.

---

## Overview

**What you'll learn:**
- Send GraphQL queries and mutations
- Use GraphQL variables
- Explore schema with introspection
- Write test scripts for GraphQL responses
- Handle GraphQL errors
- Test paginated queries

**Prerequisites:**
- Simba installed and running
- GitHub account (for API access)
- Basic understanding of GraphQL
- GitHub Personal Access Token

**Time required:** 40 minutes

**API used:** [GitHub GraphQL API v4](https://docs.github.com/en/graphql) - Production GraphQL API

---

## Part 1: Setup

### Get GitHub Personal Access Token

1. **Go to GitHub Settings:**
   ```
   GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   ```

2. **Generate new token:**
   ```
   Name: Simba GraphQL Testing
   Expiration: 30 days
   
   Scopes:
     ☑ repo (for repository access)
     ☑ read:user (for user profile)
     ☑ read:org (for organization data)
   ```

3. **Copy token:**
   ```
   ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Create Workspace and Collection

1. **Create workspace:**
   ```
   Workspaces → + New Workspace
   Name: GraphQL Tutorial
   Description: Learning GraphQL testing with GitHub API
   ```

2. **Create collection:**
   ```
   Collections → + New Collection
   Name: GitHub GraphQL API
   Description: Testing GitHub's GraphQL API v4
   ```

3. **Create environment:**
   ```
   Environments → + New Environment
   Name: GitHub GraphQL
   
   Variables:
     graphqlEndpoint:  https://api.github.com/graphql
     githubToken:      ghp_your_token_here (secret)
     repoOwner:        github
     repoName:         docs
     username:         (your GitHub username)
   ```

4. **Activate environment:**
   ```
   Environment dropdown → Select "GitHub GraphQL"
   ```

---

## Part 2: Your First GraphQL Query

### Test 1: Simple Viewer Query

**Create request:**
```
Collection: GitHub GraphQL API
Request name: Get Viewer Profile
Request Type: GraphQL
URL: {{graphqlEndpoint}}
```

**Authentication:**
```
Auth Type: Bearer Token
Token: {{githubToken}}
```

**GraphQL Query:**
```graphql
query GetViewer {
  viewer {
    login
    name
    email
    bio
    createdAt
    followers {
      totalCount
    }
    following {
      totalCount
    }
  }
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Response has data", () => {
    const response = pm.response.json();
    pm.expect(response).to.have.property('data');
    pm.expect(response.data).to.have.property('viewer');
});

pm.test("Viewer has login", () => {
    const viewer = pm.response.json().data.viewer;
    pm.expect(viewer.login).to.be.a('string').and.not.empty;
    
    // Save username for later queries
    pm.environment.set('username', viewer.login);
    console.log('GitHub username:', viewer.login);
});

pm.test("No errors in response", () => {
    const response = pm.response.json();
    pm.expect(response).to.not.have.property('errors');
});
```

**Send request:**
```
Response:
  Status: 200 OK
  
Body:
  {
    "data": {
      "viewer": {
        "login": "octocat",
        "name": "The Octocat",
        "email": "octocat@github.com",
        "bio": "GitHub mascot",
        "createdAt": "2008-01-14T04:33:35Z",
        "followers": {
          "totalCount": 3500
        },
        "following": {
          "totalCount": 9
        }
      }
    }
  }

Tests: ✅ 4/4 passed
```

---

## Part 3: Query with Variables

### Test 2: Get Repository Information

**Create request:**
```
Request name: Get Repository
Request Type: GraphQL
URL: {{graphqlEndpoint}}
Auth: Bearer Token → {{githubToken}}
```

**GraphQL Query:**
```graphql
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    description
    url
    createdAt
    updatedAt
    stargazerCount
    forkCount
    isPrivate
    primaryLanguage {
      name
      color
    }
    owner {
      login
      avatarUrl
    }
  }
}
```

**GraphQL Variables:**
```json
{
  "owner": "{{repoOwner}}",
  "name": "{{repoName}}"
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Repository data is complete", () => {
    const repo = pm.response.json().data.repository;
    
    pm.expect(repo.name).to.equal(pm.environment.get('repoName'));
    pm.expect(repo.owner.login).to.equal(pm.environment.get('repoOwner'));
    pm.expect(repo.url).to.include('github.com');
});

pm.test("Repository has stars", () => {
    const repo = pm.response.json().data.repository;
    pm.expect(repo.stargazerCount).to.be.a('number').and.at.least(0);
});

pm.test("Primary language is present", () => {
    const repo = pm.response.json().data.repository;
    if (repo.primaryLanguage) {
        pm.expect(repo.primaryLanguage.name).to.be.a('string');
    }
});
```

**Send request:**
```
Response:
  {
    "data": {
      "repository": {
        "name": "docs",
        "description": "The open-source repo for docs.github.com",
        "url": "https://github.com/github/docs",
        "createdAt": "2019-09-23T22:54:36Z",
        "updatedAt": "2024-03-15T10:30:00Z",
        "stargazerCount": 14500,
        "forkCount": 60000,
        "isPrivate": false,
        "primaryLanguage": {
          "name": "JavaScript",
          "color": "#f1e05a"
        },
        "owner": {
          "login": "github",
          "avatarUrl": "https://avatars.githubusercontent.com/u/9919?v=4"
        }
      }
    }
  }

Tests: ✅ 4/4 passed
```

---

## Part 4: Nested Queries with Pagination

### Test 3: Get Repository Issues (Paginated)

**Create request:**
```
Request name: Get Repository Issues
Request Type: GraphQL
```

**GraphQL Query:**
```graphql
query GetRepositoryIssues($owner: String!, $name: String!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    issues(first: $first, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          number
          title
          state
          author {
            login
          }
          createdAt
          comments {
            totalCount
          }
          labels(first: 5) {
            edges {
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
}
```

**Variables:**
```json
{
  "owner": "{{repoOwner}}",
  "name": "{{repoName}}",
  "first": 10
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Issues array is present", () => {
    const issues = pm.response.json().data.repository.issues;
    pm.expect(issues).to.have.property('edges');
    pm.expect(issues.edges).to.be.an('array');
});

pm.test("Retrieved correct number of issues", () => {
    const issues = pm.response.json().data.repository.issues;
    const requested = parseInt(pm.environment.get('first') || 10);
    pm.expect(issues.edges.length).to.be.at.most(requested);
});

pm.test("Each issue has required fields", () => {
    const issues = pm.response.json().data.repository.issues.edges;
    
    if (issues.length > 0) {
        const firstIssue = issues[0].node;
        pm.expect(firstIssue).to.have.property('number');
        pm.expect(firstIssue).to.have.property('title');
        pm.expect(firstIssue).to.have.property('state');
        pm.expect(firstIssue).to.have.property('author');
    }
});

pm.test("PageInfo includes pagination data", () => {
    const pageInfo = pm.response.json().data.repository.issues.pageInfo;
    pm.expect(pageInfo).to.have.property('hasNextPage');
    pm.expect(pageInfo.hasNextPage).to.be.a('boolean');
    
    if (pageInfo.hasNextPage) {
        pm.expect(pageInfo.endCursor).to.be.a('string');
        pm.environment.set('nextCursor', pageInfo.endCursor);
        console.log('Next cursor:', pageInfo.endCursor);
    }
});
```

**Response:**
```json
{
  "data": {
    "repository": {
      "issues": {
        "totalCount": 542,
        "pageInfo": {
          "hasNextPage": true,
          "endCursor": "Y3Vyc29yOnYyOpK5MjAyNC0wMy0xNVQxMDozMDowMC0wNzowMM4AXYjK"
        },
        "edges": [
          {
            "node": {
              "number": 1234,
              "title": "Update documentation for new feature",
              "state": "OPEN",
              "author": {
                "login": "contributor123"
              },
              "createdAt": "2024-03-15T10:30:00Z",
              "comments": {
                "totalCount": 5
              },
              "labels": {
                "edges": [
                  {
                    "node": {
                      "name": "documentation",
                      "color": "0075ca"
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
  }
}

Tests: ✅ 5/5 passed
```

---

## Part 5: Mutations

### Test 4: Add Star to Repository

**Create request:**
```
Request name: Add Star to Repository
Request Type: GraphQL
```

**Pre-request script:**
```javascript
// Get repository ID first (you'd normally do this in a separate query)
// For this example, we'll use a known repository ID
pm.environment.set('repositoryId', 'MDEwOlJlcG9zaXRvcnkyMTI1MTY1OTY=');
```

**GraphQL Mutation:**
```graphql
mutation AddStar($repositoryId: ID!) {
  addStar(input: {starrableId: $repositoryId}) {
    starrable {
      ... on Repository {
        name
        stargazerCount
      }
    }
  }
}
```

**Variables:**
```json
{
  "repositoryId": "{{repositoryId}}"
}
```

**Test script:**
```javascript
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Mutation executed successfully", () => {
    const response = pm.response.json();
    pm.expect(response).to.have.property('data');
    pm.expect(response.data).to.have.property('addStar');
});

pm.test("Repository is now starred", () => {
    const result = pm.response.json().data.addStar;
    pm.expect(result.starrable).to.have.property('name');
    pm.expect(result.starrable.stargazerCount).to.be.a('number');
});

pm.test("No errors", () => {
    const response = pm.response.json();
    pm.expect(response).to.not.have.property('errors');
});
```

### Test 5: Remove Star from Repository

**Create request:**
```
Request name: Remove Star from Repository
Request Type: GraphQL
```

**GraphQL Mutation:**
```graphql
mutation RemoveStar($repositoryId: ID!) {
  removeStar(input: {starrableId: $repositoryId}) {
    starrable {
      ... on Repository {
        name
        stargazerCount
      }
    }
  }
}
```

**Variables:**
```json
{
  "repositoryId": "{{repositoryId}}"
}
```

**Test script:**
```javascript
pm.test("Star removed successfully", () => {
    const response = pm.response.json();
    pm.expect(response.data.removeStar).to.exist;
});
```

---

## Part 6: Schema Introspection

### Test 6: Explore Schema

**Create request:**
```
Request name: Get GraphQL Schema Types
Request Type: GraphQL
```

**GraphQL Query (Introspection):**
```graphql
query IntrospectSchema {
  __schema {
    types {
      name
      kind
      description
    }
  }
}
```

**Test script:**
```javascript
pm.test("Schema types retrieved", () => {
    const schema = pm.response.json().data.__schema;
    pm.expect(schema.types).to.be.an('array');
    pm.expect(schema.types.length).to.be.above(0);
});

pm.test("Schema contains Query type", () => {
    const types = pm.response.json().data.__schema.types;
    const queryType = types.find(t => t.name === 'Query');
    pm.expect(queryType).to.exist;
    pm.expect(queryType.kind).to.equal('OBJECT');
});

pm.test("Schema contains Mutation type", () => {
    const types = pm.response.json().data.__schema.types;
    const mutationType = types.find(t => t.name === 'Mutation');
    pm.expect(mutationType).to.exist;
});
```

### Test 7: Get Type Details

**GraphQL Query:**
```graphql
query GetTypeDetails {
  __type(name: "Repository") {
    name
    kind
    description
    fields {
      name
      type {
        name
        kind
      }
      args {
        name
        type {
          name
        }
      }
      description
    }
  }
}
```

**Test script:**
```javascript
pm.test("Repository type has expected fields", () => {
    const repoType = pm.response.json().data.__type;
    const fieldNames = repoType.fields.map(f => f.name);
    
    // Check for common fields
    pm.expect(fieldNames).to.include('name');
    pm.expect(fieldNames).to.include('description');
    pm.expect(fieldNames).to.include('stargazerCount');
    pm.expect(fieldNames).to.include('issues');
});
```

---

## Part 7: Error Handling

### Test 8: Invalid Query

**Create request:**
```
Request name: Test Invalid Query
Request Type: GraphQL
```

**GraphQL Query (intentionally invalid):**
```graphql
query InvalidQuery {
  repository(owner: "{{repoOwner}}", name: "nonexistent-repo-12345") {
    name
    description
  }
}
```

**Test script:**
```javascript
pm.test("Status code is 200 (GraphQL errors in body)", () => {
    pm.response.to.have.status(200);
});

pm.test("Response contains errors", () => {
    const response = pm.response.json();
    pm.expect(response).to.have.property('errors');
    pm.expect(response.errors).to.be.an('array');
    pm.expect(response.errors.length).to.be.above(0);
});

pm.test("Error message is descriptive", () => {
    const errors = pm.response.json().errors;
    pm.expect(errors[0]).to.have.property('message');
    pm.expect(errors[0].message).to.include('Could not resolve');
});

pm.test("Error includes path", () => {
    const errors = pm.response.json().errors;
    pm.expect(errors[0]).to.have.property('path');
});
```

### Test 9: Field Error (Missing Required Argument)

**GraphQL Query:**
```graphql
query MissingArgument {
  repository {
    name
  }
}
```

**Expected response:**
```json
{
  "errors": [
    {
      "message": "Field 'repository' is missing required arguments: owner, name",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ]
    }
  ]
}
```

**Test script:**
```javascript
pm.test("Validation error for missing arguments", () => {
    const response = pm.response.json();
    pm.expect(response.errors).to.exist;
    pm.expect(response.errors[0].message).to.include('required arguments');
});
```

---

## Part 8: Complex Query Chaining

### Workflow: Full Repository Analysis

**Request 1: Get Repository ID**
```graphql
query GetRepositoryId($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    owner {
      login
    }
  }
}
```

**Test script:**
```javascript
// Save repository ID for mutations
const repoId = pm.response.json().data.repository.id;
pm.environment.set('repositoryId', repoId);
console.log('Repository ID:', repoId);
```

**Request 2: Get Pull Requests**
```graphql
query GetPullRequests($owner: String!, $name: String!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: $first, states: OPEN) {
      totalCount
      edges {
        node {
          number
          title
          author {
            login
          }
          createdAt
          mergeable
        }
      }
    }
  }
}
```

**Request 3: Get Contributors**
```graphql
query GetContributors($owner: String!, $name: String!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    mentionableUsers(first: $first) {
      edges {
        node {
          login
          name
          contributions: contributionsCollection {
            totalCommitContributions
          }
        }
      }
    }
  }
}
```

**Request 4: Aggregate Statistics**
```graphql
query GetRepoStats($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    stargazerCount
    forkCount
    issues(states: OPEN) {
      totalCount
    }
    pullRequests(states: OPEN) {
      totalCount
    }
    discussions {
      totalCount
    }
    releases(first: 1, orderBy: {field: CREATED_AT, direction: DESC}) {
      edges {
        node {
          name
          tagName
          publishedAt
        }
      }
    }
  }
}
```

**Test script:**
```javascript
pm.test("Complete repository stats collected", () => {
    const repo = pm.response.json().data.repository;
    
    // Log stats summary
    console.log('Repository Statistics:');
    console.log('Stars:', repo.stargazerCount);
    console.log('Forks:', repo.forkCount);
    console.log('Open Issues:', repo.issues.totalCount);
    console.log('Open PRs:', repo.pullRequests.totalCount);
    console.log('Discussions:', repo.discussions.totalCount);
    
    if (repo.releases.edges.length > 0) {
        console.log('Latest Release:', repo.releases.edges[0].node.tagName);
    }
    
    pm.expect(repo.stargazerCount).to.be.a('number');
});
```

---

## Part 9: Advanced Testing

### Aliases in Queries

**Query with aliases:**
```graphql
query CompareRepositories($owner1: String!, $repo1: String!, $owner2: String!, $repo2: String!) {
  firstRepo: repository(owner: $owner1, name: $repo1) {
    name
    stargazerCount
  }
  secondRepo: repository(owner: $owner2, name: $repo2) {
    name
    stargazerCount
  }
}
```

**Variables:**
```json
{
  "owner1": "facebook",
  "repo1": "react",
  "owner2": "vuejs",
  "repo2": "vue"
}
```

**Test script:**
```javascript
pm.test("Both repositories retrieved", () => {
    const data = pm.response.json().data;
    pm.expect(data.firstRepo).to.exist;
    pm.expect(data.secondRepo).to.exist;
});

pm.test("Compare star counts", () => {
    const data = pm.response.json().data;
    console.log(`${data.firstRepo.name}: ${data.firstRepo.stargazerCount} stars`);
    console.log(`${data.secondRepo.name}: ${data.secondRepo.stargazerCount} stars`);
    
    pm.expect(data.firstRepo.stargazerCount).to.be.a('number');
    pm.expect(data.secondRepo.stargazerCount).to.be.a('number');
});
```

### Fragments for Reusability

**Query with fragments:**
```graphql
query GetUserAndOrganization($user: String!, $org: String!) {
  user(login: $user) {
    ...UserInfo
  }
  organization(login: $org) {
    ...OrgInfo
  }
}

fragment UserInfo on User {
  login
  name
  bio
  repositories {
    totalCount
  }
  followers {
    totalCount
  }
}

fragment OrgInfo on Organization {
  login
  name
  description
  repositories {
    totalCount
  }
  membersWithRole {
    totalCount
  }
}
```

---

## Part 10: Collection Organization

### Final Collection Structure

```
📁 GitHub GraphQL API
  📂 Basic Queries
    ├── Get Viewer Profile
    ├── Get Repository
    └── Get Repository Issues
  
  📂 Mutations
    ├── Add Star to Repository
    └── Remove Star from Repository
  
  📂 Schema Introspection
    ├── Get GraphQL Schema Types
    └── Get Type Details
  
  📂 Error Handling
    ├── Test Invalid Query
    └── Test Missing Arguments
  
  📂 Advanced Queries
    ├── Get Pull Requests
    ├── Get Contributors
    ├── Get Repo Stats
    ├── Compare Repositories
    └── User and Organization Info
  
  📂 Complete Workflow
    ├── 1. Get Repository ID
    ├── 2. Get Pull Requests
    ├── 3. Get Contributors
    └── 4. Aggregate Statistics
```

---

## Part 11: Collection Runner

### Run Entire Collection

```
Collection Runner:
  Collection: GitHub GraphQL API
  Environment: GitHub GraphQL
  Iterations: 1
  
Results:
  ✅ Basic Queries: 13/13 tests passed
  ✅ Mutations: 6/6 tests passed
  ✅ Schema Introspection: 5/5 tests passed
  ✅ Error Handling: 5/5 tests passed
  ✅ Advanced Queries: 15/15 tests passed
  ✅ Complete Workflow: 12/12 tests passed
  
  Total: 56/56 tests passed (100%)
  Duration: 4.2 seconds
```

---

## Best Practices for GraphQL Testing

### ✅ DO

**Request only needed fields:**
```graphql
query GetUser($login: String!) {
  user(login: $login) {
    login        # Only what you need
    name
    email
  }
}
```

**Use fragments for repeated structures:**
```graphql
fragment RepoFields on Repository {
  name
  description
  stargazerCount
  forkCount
}

query {
  repo1: repository(...) {
    ...RepoFields
  }
  repo2: repository(...) {
    ...RepoFields
  }
}
```

**Handle pagination properly:**
```graphql
query GetIssues($cursor: String) {
  repository(...) {
    issues(first: 10, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges { node { ... } }
    }
  }
}
```

**Test both success and error cases:**
```javascript
// Success test
pm.test("Query succeeded", () => {
    pm.expect(pm.response.json().data).to.exist;
});

// Error test  
pm.test("Handles errors gracefully", () => {
    const response = pm.response.json();
    if (response.errors) {
        pm.expect(response.errors[0].message).to.be.a('string');
    }
});
```

### ❌ DON'T

**Don't over-fetch data:**
```graphql
# Bad: Requesting everything
query {
  repository(...) {
    ... # All 50+ fields
  }
}

# Good: Only what you need
query {
  repository(...) {
    name
    stargazerCount
  }
}
```

**Don't ignore GraphQL errors:**
```javascript
// Bad
pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
});

// Good
pm.test("Successful with no errors", () => {
    pm.response.to.have.status(200);
    pm.expect(pm.response.json().errors).to.not.exist;
});
```

---

## Next Steps

**Expand your GraphQL testing:**
1. Test other public GraphQL APIs (Shopify, Contentful, Hasura)
2. Add subscription testing (WebSocket-based)
3. Test complex nested queries
4. Implement end-to-end workflows

**Real-world integration:**
1. Replace GitHub API with your own GraphQL API
2. Add authentication for your API
3. Test against multiple environments
4. Automate with CI/CD

---

## Related Topics

- [GraphQL Overview](../graphql/overview.md) - GraphQL fundamentals in Simba
- [GraphQL Queries](../graphql/queries.md) - Query syntax and patterns
- [GraphQL Variables](../graphql/variables.md) - Variable usage guide
- [Test Scripts](../advanced/test-scripts.md) - Advanced test scripting
- [REST API Testing](rest-api-testing.md) - Compare with REST testing
- [CI/CD Integration](cicd-integration.md) - Automate GraphQL tests
