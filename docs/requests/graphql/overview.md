# GraphQL Overview

Learn about GraphQL, its advantages, and when to use it over REST APIs.

---

## What is GraphQL?

**GraphQL** is a query language and runtime for APIs, developed by Facebook in 2012 and open-sourced in 2015. Unlike REST, which exposes multiple endpoints for different resources, GraphQL provides a single endpoint where clients can request exactly the data they need.

### Key Characteristics

- **Single Endpoint**: All operations go through one URL (e.g., `/graphql`)
- **Strongly Typed**: Schema defines all types, fields, and operations
- **Client-Driven**: Clients specify exactly what data they need
- **Real-time**: Built-in support for subscriptions
- **Introspectable**: Schema can be queried for documentation

---

## GraphQL vs REST

| Aspect | REST | GraphQL |
|--------|------|---------|
| **Endpoints** | Multiple (`/users`, `/posts`, `/comments`) | Single (`/graphql`) |
| **Data Fetching** | Fixed response structure | Client specifies fields |
| **Over-fetching** | Common (get all fields) | Eliminated (request specific fields) |
| **Under-fetching** | Requires multiple requests | Single request for nested data |
| **Versioning** | URL versioning (`/v1/`, `/v2/`) | Schema evolution (deprecation) |
| **HTTP Methods** | GET, POST, PUT, DELETE, PATCH | POST (typically) |
| **Caching** | Built-in HTTP caching | Custom implementation needed |
| **Learning Curve** | Lower | Higher |

### Example Comparison

**REST Approach** (3 requests):
```bash
# Get user
GET /api/users/123

# Get user's posts
GET /api/users/123/posts

# Get comments for each post
GET /api/posts/456/comments
```

**GraphQL Approach** (1 request):
```graphql
query {
  user(id: "123") {
    name
    email
    posts(limit: 10) {
      title
      comments(limit: 5) {
        author
        text
      }
    }
  }
}
```

---

## Core Concepts

### Schema

The schema is the contract between client and server, defining:

```graphql
# Types
type User {
  id: ID!
  name: String!
  email: String
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String
  author: User!
}

# Queries (read operations)
type Query {
  user(id: ID!): User
  users(limit: Int): [User!]!
  post(id: ID!): Post
}

# Mutations (write operations)
type Mutation {
  createUser(name: String!, email: String!): User!
  updateUser(id: ID!, name: String): User
  deleteUser(id: ID!): Boolean
}

# Subscriptions (real-time updates)
type Subscription {
  userCreated: User!
  postUpdated(userId: ID!): Post!
}
```

### Operations

GraphQL has three operation types:

1. **Query** - Read data (like GET)
2. **Mutation** - Modify data (like POST/PUT/DELETE)
3. **Subscription** - Real-time updates (WebSocket)

### Fields

Fields are the units of data you request:

```graphql
{
  user(id: "123") {
    name        # Scalar field
    email       # Nullable field
    posts {     # Object field (relationship)
      title
    }
  }
}
```

### Arguments

Fields can accept arguments:

```graphql
{
  users(
    limit: 10
    offset: 20
    orderBy: "createdAt"
    filter: { role: "admin" }
  ) {
    name
  }
}
```

### Aliases

Rename fields in the response:

```graphql
{
  smallPosts: posts(limit: 3) {
    title
  }
  largePosts: posts(limit: 100) {
    title
  }
}
```

### Fragments

Reusable groups of fields:

```graphql
fragment UserFields on User {
  id
  name
  email
}

{
  user1: user(id: "1") {
    ...UserFields
  }
  user2: user(id: "2") {
    ...UserFields
  }
}
```

### Variables

Parameterize queries:

```graphql
query GetUser($userId: ID!, $postLimit: Int = 10) {
  user(id: $userId) {
    name
    posts(limit: $postLimit) {
      title
    }
  }
}
```

Variables (JSON):
```json
{
  "userId": "123",
  "postLimit": 5
}
```

---

## When to Use GraphQL

### ✅ Good Use Cases

**1. Mobile Applications**
- Limited bandwidth
- Battery efficiency
- Need precise data fetching

**2. Complex Data Requirements**
- Nested relationships (users → posts → comments)
- Multiple related resources
- Different views need different data

**3. Rapid Frontend Development**
- Frontend teams control data needs
- No backend changes for new UI requirements
- Faster iteration cycles

**4. Microservices Architecture**
- GraphQL gateway over multiple services
- Single API layer
- Unified schema

**5. Real-time Applications**
- Chat applications
- Live dashboards
- Collaborative editing

### ❌ When to Avoid GraphQL

**1. Simple CRUD APIs**
- Standard REST is sufficient
- No complex relationships

**2. File Uploads/Downloads**
- REST is better suited
- HTTP caching benefits

**3. Heavy Caching Requirements**
- REST HTTP caching is mature
- GraphQL caching more complex

**4. Small Team/Simple App**
- Learning curve not justified
- REST tooling is simpler

**5. Third-party Integration**
- Most APIs are REST
- Authentication flows built for REST

---

## GraphQL in Simba

Simba provides first-class GraphQL support:

### Features

✅ **Single Request Type**
- No need to switch between GET/POST
- All GraphQL uses POST to `/graphql`

✅ **Schema Introspection**
- Auto-discover types and fields
- Built-in schema explorer
- Field documentation

✅ **Query Builder**
- Visual query construction
- Field selection UI
- Auto-completion

✅ **Variables Support**
- Simba variables: `{{varName}}`
- GraphQL variables: `$varName`
- Environment variables

✅ **Test Scripts**
- Validate response structure
- Assert on nested data
- Parse GraphQL errors

✅ **History & Collections**
- Save GraphQL queries
- Organize by collection
- Share with team

---

## Quick Start Example

### 1. Create a GraphQL Request

**Endpoint:**
```
https://api.github.com/graphql
```

**Headers:**
```
Authorization: Bearer {{githubToken}}
Content-Type: application/json
```

### 2. Write a Query

```graphql
query {
  viewer {
    login
    name
    bio
    repositories(first: 5) {
      nodes {
        name
        stargazerCount
      }
    }
  }
}
```

### 3. Execute & Test

**Test Script:**
```javascript
pm.test("Status is 200", () => {
  pm.response.to.have.status(200);
});

pm.test("Response has data", () => {
  const json = pm.response.json();
  pm.expect(json.data).to.exist;
  pm.expect(json.data.viewer).to.exist;
});

pm.test("Has repositories", () => {
  const repos = pm.response.json().data.viewer.repositories.nodes;
  pm.expect(repos).to.be.an('array');
  pm.expect(repos.length).to.be.at.most(5);
});

pm.test("No GraphQL errors", () => {
  const json = pm.response.json();
  pm.expect(json.errors).to.be.undefined;
});
```

---

## Understanding GraphQL Responses

### Success Response

```json
{
  "data": {
    "user": {
      "name": "John Doe",
      "posts": [
        { "title": "First Post" }
      ]
    }
  }
}
```

### Error Response

```json
{
  "errors": [
    {
      "message": "Cannot query field \"posst\" on type \"User\". Did you mean \"posts\"?",
      "locations": [{ "line": 4, "column": 5 }],
      "extensions": {
        "code": "GRAPHQL_VALIDATION_FAILED"
      }
    }
  ]
}
```

### Partial Success (GraphQL handles partial failures)

```json
{
  "data": {
    "user": {
      "name": "John Doe",
      "posts": null
    }
  },
  "errors": [
    {
      "message": "Failed to fetch posts",
      "path": ["user", "posts"],
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR"
      }
    }
  ]
}
```

---

## Best Practices

### 1. Use Descriptive Operation Names

❌ **Bad:**
```graphql
query {
  user(id: "123") { name }
}
```

✅ **Good:**
```graphql
query GetUserProfile {
  user(id: "123") { name }
}
```

### 2. Use Variables for Dynamic Values

❌ **Bad:**
```graphql
query {
  user(id: "123") { name }
}
```

✅ **Good:**
```graphql
query GetUser($userId: ID!) {
  user(id: $userId) { name }
}
```

### 3. Request Only Needed Fields

❌ **Bad:**
```graphql
{
  user(id: "123") {
    id name email bio avatarUrl
    createdAt updatedAt status role
    preferences { theme language }
    # ... many more fields
  }
}
```

✅ **Good:**
```graphql
{
  user(id: "123") {
    name
    email
  }
}
```

### 4. Use Fragments for Reusability

❌ **Bad:**
```graphql
{
  user1: user(id: "1") {
    id name email
  }
  user2: user(id: "2") {
    id name email
  }
}
```

✅ **Good:**
```graphql
fragment UserInfo on User {
  id name email
}

{
  user1: user(id: "1") { ...UserInfo }
  user2: user(id: "2") { ...UserInfo }
}
```

### 5. Handle Errors Gracefully

```javascript
pm.test("Check GraphQL response", () => {
  const json = pm.response.json();
  
  // HTTP status should be 200 even with GraphQL errors
  pm.response.to.have.status(200);
  
  if (json.errors) {
    console.log("GraphQL Errors:", json.errors);
    pm.expect(json.errors).to.be.empty;
  }
  
  pm.expect(json.data).to.exist;
});
```

---

## Common Patterns

### Pagination (Cursor-based)

```graphql
query GetPosts($cursor: String, $limit: Int = 10) {
  posts(first: $limit, after: $cursor) {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Pagination (Offset-based)

```graphql
query GetUsers($offset: Int = 0, $limit: Int = 20) {
  users(offset: $offset, limit: $limit) {
    id
    name
  }
  usersCount
}
```

### Filtering

```graphql
query SearchPosts($searchTerm: String!, $category: String) {
  posts(
    filter: {
      title_contains: $searchTerm
      category: $category
      status: PUBLISHED
    }
  ) {
    id
    title
  }
}
```

### Sorting

```graphql
query GetPosts($orderBy: PostOrderByInput) {
  posts(orderBy: $orderBy) {
    id
    title
    createdAt
  }
}
```

Variables:
```json
{
  "orderBy": {
    "field": "createdAt",
    "direction": "DESC"
  }
}
```

---

## Troubleshooting

### Issue: "Field X doesn't exist"

**Error:**
```json
{
  "errors": [{
    "message": "Cannot query field \"posst\" on type \"User\"."
  }]
}
```

**Solution:**
- Check spelling (typo: `posst` → `posts`)
- Use schema explorer to see available fields
- Verify field is on correct type

### Issue: Missing Required Arguments

**Error:**
```json
{
  "errors": [{
    "message": "Field \"user\" argument \"id\" of type \"ID!\" is required"
  }]
}
```

**Solution:**
```graphql
# Add missing argument
query {
  user(id: "123") {
    name
  }
}
```

### Issue: Type Mismatch

**Error:**
```json
{
  "errors": [{
    "message": "Int cannot represent non-integer value: \"abc\""
  }]
}
```

**Solution:**
```json
// Use correct type
{ "limit": 10 }  // not "10"
```

### Issue: Nested Fields Too Deep

**Error:**
```json
{
  "errors": [{
    "message": "Query depth limit exceeded"
  }]
}
```

**Solution:**
- Reduce nesting levels
- Use pagination for lists
- Backend has depth limits (typically 5-10 levels)

### Issue: Authentication Failed

**Error:**
```json
{
  "errors": [{
    "message": "Unauthorized",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

**Solution:**
- Check authorization header
- Verify token is valid
- Use correct authentication method

---

## Testing GraphQL APIs

### Complete Test Suite Example

```javascript
// Test 1: HTTP Status
pm.test("HTTP status is 200", () => {
  pm.response.to.have.status(200);
});

// Test 2: Response time
pm.test("Response time < 500ms", () => {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

// Test 3: Content-Type header
pm.test("Content-Type is JSON", () => {
  pm.expect(pm.response.headers.get("Content-Type"))
    .to.include("application/json");
});

// Test 4: No GraphQL errors
pm.test("No GraphQL errors", () => {
  const json = pm.response.json();
  if (json.errors) {
    console.error("GraphQL Errors:", json.errors);
  }
  pm.expect(json.errors).to.be.undefined;
});

// Test 5: Data structure
pm.test("Response has correct structure", () => {
  const data = pm.response.json().data;
  pm.expect(data).to.have.property('user');
  pm.expect(data.user).to.have.property('name');
  pm.expect(data.user).to.have.property('posts');
});

// Test 6: Data validation
pm.test("User data is valid", () => {
  const user = pm.response.json().data.user;
  pm.expect(user.name).to.be.a('string').and.not.empty;
  pm.expect(user.posts).to.be.an('array');
});

// Test 7: Business logic
pm.test("Has at least one post", () => {
  const posts = pm.response.json().data.user.posts;
  pm.expect(posts.length).to.be.at.least(1);
});

// Save data for next request
const userId = pm.response.json().data.user.id;
pm.environment.set("userId", userId);
```

---

## Performance Considerations

### Query Complexity

GraphQL allows clients to request deeply nested data, which can cause performance issues:

**Problematic Query:**
```graphql
{
  users {          # 1000 users
    posts {        # 100 posts per user = 100,000 queries
      comments {   # 50 comments per post = 5,000,000 queries
        author {
          posts {  # N+1 problem
            comments { ... }
          }
        }
      }
    }
  }
}
```

**Solutions:**
1. **Pagination**: Limit results
2. **Depth Limiting**: Backend restricts nesting
3. **Complexity Analysis**: Backend calculates query cost
4. **DataLoader**: Batch and cache requests

### Optimizing Queries

✅ **Good Query:**
```graphql
query GetDashboard {
  viewer {
    name
    recentPosts: posts(first: 5) {
      title
      commentCount  # Aggregated field
    }
  }
}
```

❌ **Bad Query:**
```graphql
query GetDashboard {
  viewer {
    name
    posts {           # All posts!
      title
      comments {      # All comments for all posts!
        text
        author {
          name
          posts {     # Recursive deep nesting
            title
          }
        }
      }
    }
  }
}
```

---

## Real-World Example: GitHub API

### Fetching Repository Information

```graphql
query GetRepoInfo($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    description
    stargazerCount
    forkCount
    
    primaryLanguage {
      name
      color
    }
    
    issues(first: 5, states: OPEN) {
      totalCount
      nodes {
        title
        createdAt
        author {
          login
        }
      }
    }
    
    pullRequests(first: 5, states: OPEN) {
      totalCount
      nodes {
        title
        author {
          login
        }
      }
    }
  }
}
```

**Variables:**
```json
{
  "owner": "facebook",
  "name": "react"
}
```

**Test:**
```javascript
pm.test("Repository found", () => {
  const repo = pm.response.json().data.repository;
  pm.expect(repo).to.exist;
  pm.expect(repo.name).to.equal("react");
});

pm.test("Has TypeScript as primary language", () => {
  const lang = pm.response.json().data.repository.primaryLanguage;
  pm.expect(lang.name).to.equal("TypeScript");
});

pm.test("Has stars", () => {
  const stars = pm.response.json().data.repository.stargazerCount;
  pm.expect(stars).to.be.above(1000);
});
```

---

## Resources

### Learning GraphQL

- [GraphQL Official Docs](https://graphql.org/learn/)
- [How to GraphQL](https://www.howtographql.com/)
- [Apollo GraphQL Docs](https://www.apollographql.com/docs/)

### Public GraphQL APIs

- **GitHub GraphQL API**: https://docs.github.com/en/graphql
- **SpaceX API**: https://api.spacex.land/graphql/
- **Countries GraphQL**: https://countries.trevorblades.com/
- **GraphQL Pokemon**: https://graphql-pokemon2.vercel.app/
- **Rick and Morty API**: https://rickandmortyapi.com/graphql

### Tools

- **GraphiQL**: In-browser GraphQL IDE
- **GraphQL Playground**: Advanced GraphQL IDE
- **Apollo Studio**: GraphQL development platform
- **Simba**: API testing tool with GraphQL support

---

## Next Steps

Now that you understand GraphQL basics:

1. **[Write Queries](queries.md)** - Learn query syntax and patterns
2. **[Use Mutations](mutations.md)** - Modify data with mutations
3. **[Add Variables](variables.md)** - Parameterize your requests
4. **[Explore Schemas](schema-explorer.md)** - Use introspection
5. **[Tutorial](../../tutorials/graphql-testing.md)** - Complete walkthrough

## Related Topics

- [REST vs GraphQL](../rest/overview.md)
- [Authentication](../../authentication/bearer-token.md) - Most GraphQL APIs use Bearer tokens
- [Test Scripts](../../advanced/test-scripts.md) - Validate GraphQL responses
- [Variables](../../concepts/variables.md) - Using Simba variables in GraphQL
