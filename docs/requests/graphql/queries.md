# GraphQL Queries

Master GraphQL queries to fetch exactly the data you need in a single request.

---

## What are GraphQL Queries?

**Queries** are read operations in GraphQL (similar to GET in REST). They allow you to:
- Fetch data from the server
- Specify exactly which fields you want
- Request nested relationships
- Query multiple resources in one request

---

## Basic Query Syntax

### Simple Query

```graphql
query {
  user {
    name
    email
  }
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Named Query

Always name your queries for better debugging and logging:

```graphql
query GetUser {
  user {
    name
    email
  }
}
```

### Query with Arguments

```graphql
query GetUserById {
  user(id: "123") {
    name
    email
  }
}
```

---

## Field Selection

### Scalar Fields

Basic data types: String, Int, Float, Boolean, ID

```graphql
query {
  user(id: "123") {
    id          # ID
    name        # String
    age         # Int
    rating      # Float
    isActive    # Boolean
  }
}
```

### Object Fields

Nested objects:

```graphql
query {
  user(id: "123") {
    name
    profile {
      bio
      website
      location
    }
  }
}
```

### List Fields

Arrays of items:

```graphql
query {
  user(id: "123") {
    name
    posts {
      title
      content
    }
  }
}
```

### Nullable vs Non-Nullable

Schema types indicate if fields can be null:

```graphql
type User {
  name: String!      # Required (non-null)
  email: String      # Optional (nullable)
  posts: [Post!]!    # Non-null array of non-null posts
}
```

**Query:**
```graphql
query {
  user(id: "123") {
    name    # Always present
    email   # Might be null
  }
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "name": "John Doe",
      "email": null
    }
  }
}
```

---

## Arguments

### Single Argument

```graphql
query {
  user(id: "123") {
    name
  }
}
```

### Multiple Arguments

```graphql
query {
  users(
    limit: 10
    offset: 20
    sortBy: "createdAt"
  ) {
    name
    email
  }
}
```

### Nested Arguments

Arguments can be at any level:

```graphql
query {
  user(id: "123") {
    name
    posts(
      first: 5
      orderBy: "createdAt"
      filter: { status: "published" }
    ) {
      title
      createdAt
    }
  }
}
```

### Enum Arguments

Enums are predefined values:

```graphql
query {
  posts(status: PUBLISHED, orderBy: CREATED_AT_DESC) {
    title
  }
}
```

### Input Object Arguments

Complex arguments:

```graphql
query SearchPosts {
  posts(
    filter: {
      title_contains: "GraphQL"
      category: "technology"
      publishedAfter: "2024-01-01"
    }
  ) {
    title
    publishedAt
  }
}
```

---

## Aliases

Query the same field multiple times with different arguments:

### Basic Alias

```graphql
query {
  smallPosts: posts(limit: 3) {
    title
  }
  largePosts: posts(limit: 10) {
    title
  }
}
```

**Response:**
```json
{
  "data": {
    "smallPosts": [
      { "title": "First Post" },
      { "title": "Second Post" },
      { "title": "Third Post" }
    ],
    "largePosts": [
      { "title": "First Post" },
      // ... 7 more posts
    ]
  }
}
```

### Multiple Users

```graphql
query {
  user1: user(id: "1") {
    name
  }
  user2: user(id: "2") {
    name
  }
  user3: user(id: "3") {
    name
  }
}
```

### Practical Example

```graphql
query GetDashboardStats {
  todayPosts: posts(date: "2024-04-16") {
    totalCount
  }
  weekPosts: posts(dateRange: { from: "2024-04-10", to: "2024-04-16" }) {
    totalCount
  }
  monthPosts: posts(dateRange: { from: "2024-03-16", to: "2024-04-16" }) {
    totalCount
  }
}
```

---

## Fragments

Reusable field selections.

### Defining Fragments

```graphql
fragment UserInfo on User {
  id
  name
  email
  createdAt
}
```

### Using Fragments

```graphql
query {
  user1: user(id: "1") {
    ...UserInfo
  }
  user2: user(id: "2") {
    ...UserInfo
  }
}
```

### Multiple Fragments

```graphql
fragment BasicInfo on User {
  id
  name
}

fragment ContactInfo on User {
  email
  phone
}

query GetUser {
  user(id: "123") {
    ...BasicInfo
    ...ContactInfo
    posts {
      title
    }
  }
}
```

### Nested Fragments

```graphql
fragment PostInfo on Post {
  title
  content
  author {
    ...UserInfo
  }
}

fragment UserInfo on User {
  name
  email
}

query {
  posts {
    ...PostInfo
  }
}
```

### Inline Fragments

For union types or interfaces:

```graphql
query {
  search(text: "GraphQL") {
    ... on Post {
      title
      content
    }
    ... on User {
      name
      email
    }
    ... on Comment {
      text
      author { name }
    }
  }
}
```

---

## Nested Queries

### One Level Deep

```graphql
query {
  user(id: "123") {
    name
    posts {
      title
    }
  }
}
```

### Multiple Levels

```graphql
query {
  user(id: "123") {
    name
    posts {
      title
      comments {
        text
        author {
          name
        }
      }
    }
  }
}
```

### With Pagination

```graphql
query GetUserFeed {
  user(id: "123") {
    name
    posts(first: 10) {
      edges {
        cursor
        node {
          title
          comments(first: 5) {
            edges {
              node {
                text
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Pagination Patterns

### Limit/Offset (Simple)

```graphql
query GetPosts($offset: Int = 0, $limit: Int = 10) {
  posts(offset: $offset, limit: $limit) {
    id
    title
  }
  postsCount
}
```

**First page:**
```json
{ "offset": 0, "limit": 10 }
```

**Second page:**
```json
{ "offset": 10, "limit": 10 }
```

### Cursor-based (Relay)

More robust for real-time data:

```graphql
query GetPosts($cursor: String, $first: Int = 10) {
  posts(first: $first, after: $cursor) {
    edges {
      cursor
      node {
        id
        title
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

**First page:**
```json
{ "first": 10, "cursor": null }
```

**Response:**
```json
{
  "data": {
    "posts": {
      "edges": [
        {
          "cursor": "Y3Vyc29yOjE=",
          "node": { "id": "1", "title": "First Post" }
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "Y3Vyc29yOjEw"
      }
    }
  }
}
```

**Next page:**
```json
{ "first": 10, "cursor": "Y3Vyc29yOjEw" }
```

### Backward Pagination

```graphql
query GetPosts($cursor: String, $last: Int = 10) {
  posts(last: $last, before: $cursor) {
    edges {
      cursor
      node {
        id
        title
      }
    }
    pageInfo {
      hasPreviousPage
      startCursor
    }
  }
}
```

---

## Real-World Examples

### GitHub API: Get Repository

```graphql
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    description
    url
    stargazerCount
    forkCount
    
    owner {
      login
      avatarUrl
    }
    
    primaryLanguage {
      name
      color
    }
    
    repositoryTopics(first: 5) {
      nodes {
        topic {
          name
        }
      }
    }
    
    defaultBranchRef {
      name
      target {
        ... on Commit {
          history(first: 1) {
            nodes {
              message
              committedDate
              author {
                name
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

pm.test("Has stars", () => {
  const stars = pm.response.json().data.repository.stargazerCount;
  pm.expect(stars).to.be.a('number');
  pm.expect(stars).to.be.above(100000);
});

pm.test("Has primary language", () => {
  const lang = pm.response.json().data.repository.primaryLanguage;
  pm.expect(lang).to.exist;
  pm.expect(lang.name).to.be.a('string');
});

// Save for next request
const repoUrl = pm.response.json().data.repository.url;
pm.environment.set("repoUrl", repoUrl);
```

### GitHub API: Get User Profile

```graphql
query GetUserProfile {
  viewer {
    login
    name
    bio
    company
    location
    email
    avatarUrl
    websiteUrl
    
    repositories(
      first: 10
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        url
      }
    }
    
    followers {
      totalCount
    }
    
    following {
      totalCount
    }
    
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
    }
  }
}
```

**Test:**
```javascript
pm.test("User authenticated", () => {
  const viewer = pm.response.json().data.viewer;
  pm.expect(viewer).to.exist;
  pm.expect(viewer.login).to.be.a('string').and.not.empty;
});

pm.test("Has repositories", () => {
  const repos = pm.response.json().data.viewer.repositories;
  pm.expect(repos.totalCount).to.be.at.least(0);
  pm.expect(repos.nodes).to.be.an('array');
});

pm.test("Contributions exist", () => {
  const contrib = pm.response.json().data.viewer.contributionsCollection;
  pm.expect(contrib.totalCommitContributions).to.be.a('number');
});
```

### GitHub API: Search Issues

```graphql
query SearchIssues($query: String!, $first: Int = 10) {
  search(query: $query, type: ISSUE, first: $first) {
    issueCount
    edges {
      node {
        ... on Issue {
          title
          url
          state
          createdAt
          author {
            login
          }
          repository {
            nameWithOwner
          }
          labels(first: 5) {
            nodes {
              name
              color
            }
          }
          comments {
            totalCount
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
  "query": "is:open label:bug repo:facebook/react",
  "first": 5
}
```

### SpaceX API: Get Launches

```graphql
query GetLaunches($limit: Int = 10) {
  launchesPast(limit: $limit) {
    mission_name
    launch_date_utc
    launch_success
    rocket {
      rocket_name
      rocket_type
    }
    launch_site {
      site_name
      site_name_long
    }
    links {
      article_link
      video_link
      mission_patch_small
    }
  }
}
```

**Test:**
```javascript
pm.test("Launches found", () => {
  const launches = pm.response.json().data.launchesPast;
  pm.expect(launches).to.be.an('array');
  pm.expect(launches.length).to.be.at.most(10);
});

pm.test("Each launch has required fields", () => {
  const launches = pm.response.json().data.launchesPast;
  launches.forEach(launch => {
    pm.expect(launch.mission_name).to.be.a('string');
    pm.expect(launch.rocket).to.exist;
    pm.expect(launch.launch_site).to.exist;
  });
});

pm.test("Has successful launches", () => {
  const launches = pm.response.json().data.launchesPast;
  const successful = launches.filter(l => l.launch_success === true);
  pm.expect(successful.length).to.be.above(0);
});
```

---

## Query Optimization

### Problem: Over-fetching

❌ **Bad** - Requesting unnecessary data:
```graphql
query {
  users {
    id name email bio avatarUrl
    createdAt updatedAt lastLoginAt
    preferences { theme language timezone }
    settings { notifications privacy }
    profile { address phone website }
  }
}
```

✅ **Good** - Only needed fields:
```graphql
query GetUserList {
  users {
    id
    name
    avatarUrl
  }
}
```

### Problem: N+1 Queries

❌ **Bad** - Can cause performance issues:
```graphql
query {
  posts {
    title
    author {        # Separate DB query for each post
      name
    }
    comments {
      text
      author {      # Separate DB query for each comment
        name
      }
    }
  }
}
```

**Solution**: Backend should use DataLoader or similar batching.

### Use Fragments for Consistency

```graphql
fragment PostPreview on Post {
  id
  title
  excerpt
  publishedAt
}

query GetRecentPosts {
  recentPosts: posts(first: 5) {
    ...PostPreview
  }
}

query GetTrendingPosts {
  trendingPosts: posts(orderBy: "views", first: 5) {
    ...PostPreview
  }
}
```

### Limit Depth

```graphql
# Set maximum nesting level
query GetUser {
  user(id: "123") {
    name
    posts(first: 5) {        # Level 1
      title
      comments(first: 3) {   # Level 2
        text                 # Stop here - don't go deeper
      }
    }
  }
}
```

---

## Using Simba Variables in Queries

### Environment Variables

**Environment:**
```json
{
  "userId": "12345",
  "repoOwner": "facebook",
  "repoName": "react"
}
```

**Query:**
```graphql
query GetUser {
  user(id: "{{userId}}") {
    name
    email
  }
}
```

**Resolves to:**
```graphql
query GetUser {
  user(id: "12345") {
    name
    email
  }
}
```

### In Multiple Places

```graphql
query GetRepository {
  repository(owner: "{{repoOwner}}", name: "{{repoName}}") {
    name
    url
    issues(first: 5, labels: ["{{issueLabel}}"]) {
      nodes {
        title
      }
    }
  }
}
```

### With GraphQL Variables (Recommended)

Better approach - use GraphQL variables:

**Query:**
```graphql
query GetUser($userId: ID!) {
  user(id: $userId) {
    name
    email
  }
}
```

**Variables:**
```json
{
  "userId": "{{userId}}"
}
```

This way, Simba variables are resolved in the variables JSON, not in the query itself.

---

## Query Testing Patterns

### Complete Test Suite

```javascript
// 1. Status check
pm.test("HTTP 200", () => {
  pm.response.to.have.status(200);
});

// 2. No GraphQL errors
pm.test("No GraphQL errors", () => {
  const json = pm.response.json();
  if (json.errors) {
    console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
  }
  pm.expect(json.errors).to.be.undefined;
});

// 3. Response structure
pm.test("Has data object", () => {
  const json = pm.response.json();
  pm.expect(json).to.have.property('data');
  pm.expect(json.data).to.be.an('object');
});

// 4. Expected data exists
pm.test("User data exists", () => {
  const user = pm.response.json().data.user;
  pm.expect(user).to.exist;
});

// 5. Field validation
pm.test("User has required fields", () => {
  const user = pm.response.json().data.user;
  pm.expect(user).to.have.property('id');
  pm.expect(user).to.have.property('name');
  pm.expect(user).to.have.property('email');
});

// 6. Type validation
pm.test("Fields have correct types", () => {
  const user = pm.response.json().data.user;
  pm.expect(user.id).to.be.a('string');
  pm.expect(user.name).to.be.a('string');
  pm.expect(user.posts).to.be.an('array');
});

// 7. Business logic
pm.test("Name is not empty", () => {
  const user = pm.response.json().data.user;
  pm.expect(user.name).to.have.length.above(0);
});

// 8. Nested data
pm.test("Posts have titles", () => {
  const posts = pm.response.json().data.user.posts;
  posts.forEach(post => {
    pm.expect(post).to.have.property('title');
    pm.expect(post.title).to.be.a('string');
  });
});

// 9. Performance
pm.test("Response < 1s", () => {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});

// 10. Save data for next request
const userId = pm.response.json().data.user.id;
pm.environment.set("lastUserId", userId);
```

### Testing Pagination

```javascript
pm.test("Pagination works", () => {
  const result = pm.response.json().data.posts;
  
  // Has pageInfo
  pm.expect(result).to.have.property('pageInfo');
  pm.expect(result.pageInfo).to.have.property('hasNextPage');
  
  // Has edges
  pm.expect(result.edges).to.be.an('array');
  
  // Each edge has cursor and node
  result.edges.forEach(edge => {
    pm.expect(edge).to.have.property('cursor');
    pm.expect(edge).to.have.property('node');
  });
  
  // Save cursor for next page
  if (result.pageInfo.hasNextPage) {
    pm.environment.set("nextCursor", result.pageInfo.endCursor);
  }
});
```

### Testing Error Handling

```javascript
// Check for partial errors
pm.test("Handle partial data", () => {
  const json = pm.response.json();
  
  if (json.errors) {
    // Some data may still be present
    console.warn("Partial errors:", json.errors);
    
    // Check which fields failed
    json.errors.forEach(error => {
      console.log("Failed path:", error.path);
      console.log("Error message:", error.message);
    });
  }
  
  // Data might still be useful
  if (json.data) {
    pm.expect(json.data).to.be.an('object');
  }
});
```

---

## Troubleshooting

### Issue: Fields Not Returned

**Problem:**
```graphql
query {
  user(id: "123") {
    name
    posts {
      title
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "name": "John",
      "posts": null
    }
  }
}
```

**Solutions:**
1. Field might be nullable (check schema)
2. User has no posts (empty array vs null)
3. Permission issue (not authorized to see posts)
4. Try adding error checking:

```graphql
query {
  user(id: "123") {
    name
    postsCount          # Try count first
    posts(first: 1) {   # Limit to test
      title
    }
  }
}
```

### Issue: Query Too Complex

**Error:**
```json
{
  "errors": [{
    "message": "Query is too complex",
    "extensions": {
      "code": "COMPLEXITY_LIMIT_EXCEEDED"
    }
  }]
}
```

**Solution:**
- Reduce nesting depth
- Use pagination (`first: 10`)
- Split into multiple queries
- Remove unnecessary fields

### Issue: Field Doesn't Exist

**Error:**
```json
{
  "errors": [{
    "message": "Cannot query field \"posst\" on type \"User\". Did you mean \"posts\"?"
  }]
}
```

**Solution:**
- Use schema explorer to see available fields
- Check spelling
- Field might be on different type

### Issue: Variables Not Working

**Query:**
```graphql
query GetUser($userId: ID!) {
  user(id: $userId) {
    name
  }
}
```

**Variables:**
```json
{
  "userId": 123  # ❌ Wrong type (should be string)
}
```

**Solution:**
```json
{
  "userId": "123"  # ✅ Correct
}
```

---

## Best Practices Checklist

✅ **Always name your queries**
```graphql
query GetUserProfile { ... }
```

✅ **Use variables for dynamic values**
```graphql
query GetUser($id: ID!) { ... }
```

✅ **Request only needed fields**
```graphql
{ user { name } }  # Not: { user { id name email bio ... } }
```

✅ **Use fragments for reusability**
```graphql
fragment UserInfo on User { ... }
```

✅ **Add pagination to lists**
```graphql
posts(first: 10) { ... }
```

✅ **Handle errors in tests**
```javascript
if (json.errors) { console.error(json.errors); }
```

✅ **Limit nesting depth**
```graphql
# Max 3-4 levels deep
```

✅ **Use aliases for multiple queries**
```graphql
user1: user(id: "1") { ... }
user2: user(id: "2") { ... }
```

---

## Next Steps

- **[Mutations](mutations.md)** - Learn to modify data in GraphQL
- **[Variables](variables.md)** - Master GraphQL variables
- **[Schema Explorer](schema-explorer.md)** - Explore API schemas
- **[Tutorial](../../tutorials/graphql-testing.md)** - Complete walkthrough

## Related Topics

- [GraphQL Overview](overview.md)
- [Test Scripts](../../advanced/test-scripts.md)
- [Request History](../../advanced/request-history.md)
