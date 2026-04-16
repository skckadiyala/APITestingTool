# GraphQL Mutations

Learn how to create, update, and delete data with GraphQL mutations.

---

## What are GraphQL Mutations?

**Mutations** are write operations in GraphQL (similar to POST, PUT, PATCH, DELETE in REST). They allow you to:
- Create new data
- Update existing data
- Delete data
- Trigger server-side actions

---

## Mutation vs Query

| Aspect | Query | Mutation |
|--------|-------|----------|
| **Purpose** | Read data | Write data |
| **Side effects** | None | Modifies server state |
| **Execution** | Parallel (can be) | Sequential (guaranteed) |
| **Convention** | `query { ... }` | `mutation { ... }` |
| **REST equivalent** | GET | POST/PUT/PATCH/DELETE |

---

## Basic Mutation Syntax

### Simple Mutation

```graphql
mutation {
  createUser(name: "John Doe", email: "john@example.com") {
    id
    name
    email
    createdAt
  }
}
```

**Response:**
```json
{
  "data": {
    "createUser": {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-04-16T10:00:00Z"
    }
  }
}
```

### Named Mutation

Always name your mutations:

```graphql
mutation CreateNewUser {
  createUser(name: "John Doe", email: "john@example.com") {
    id
    name
  }
}
```

### Mutation with Variables (Recommended)

```graphql
mutation CreateUser($name: String!, $email: String!) {
  createUser(name: $name, email: $email) {
    id
    name
    email
  }
}
```

**Variables:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## Common Mutation Patterns

### Create (POST equivalent)

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    content
    author {
      name
    }
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "title": "Getting Started with GraphQL",
    "content": "GraphQL is a query language...",
    "authorId": "123",
    "tags": ["graphql", "tutorial"]
  }
}
```

### Update (PUT/PATCH equivalent)

```graphql
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "123",
  "input": {
    "name": "Jane Doe",
    "bio": "GraphQL enthusiast"
  }
}
```

### Delete (DELETE equivalent)

```graphql
mutation DeletePost($id: ID!) {
  deletePost(id: $id) {
    success
    message
    deletedId
  }
}
```

**Variables:**
```json
{
  "id": "456"
}
```

### Upsert (Create or Update)

```graphql
mutation UpsertUser($email: String!, $input: UserInput!) {
  upsertUser(email: $email, input: $input) {
    id
    name
    email
    isNew
  }
}
```

---

## Input Types

### Simple Inputs

```graphql
mutation CreateTag($name: String!, $color: String!) {
  createTag(name: $name, color: $color) {
    id
    name
    color
  }
}
```

### Complex Input Objects

```graphql
# Schema defines input type
input CreateUserInput {
  name: String!
  email: String!
  profile: ProfileInput
  preferences: PreferencesInput
}

input ProfileInput {
  bio: String
  website: String
  location: String
}

input PreferencesInput {
  theme: String
  language: String
  notifications: Boolean
}
```

**Mutation:**
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    profile {
      bio
      website
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "bio": "Software developer",
      "website": "https://johndoe.com"
    },
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

### Lists in Inputs

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    tags {
      name
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "title": "My Post",
    "tags": ["graphql", "api", "tutorial"],
    "collaboratorIds": ["user1", "user2"]
  }
}
```

---

## Multiple Mutations

You can execute multiple mutations in one request. They run **sequentially** (not parallel):

```graphql
mutation CreateUserAndPost {
  # First: Create user
  user: createUser(name: "John", email: "john@example.com") {
    id
    name
  }
  
  # Then: Create post (can't use user.id in same request)
  post: createPost(title: "My First Post", authorId: "123") {
    id
    title
  }
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "123",
      "name": "John"
    },
    "post": {
      "id": "456",
      "title": "My First Post"
    }
  }
}
```

**Important**: You can't use the result of the first mutation as input to the second in the same request. You need two separate requests.

---

## Real-World Examples

### GitHub API: Create Repository

```graphql
mutation CreateRepo($input: CreateRepositoryInput!) {
  createRepository(input: $input) {
    repository {
      id
      name
      url
      description
      visibility
      owner {
        login
      }
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "my-new-repo",
    "description": "A test repository",
    "visibility": "PUBLIC",
    "hasIssuesEnabled": true,
    "hasWikiEnabled": false
  }
}
```

**Test:**
```javascript
pm.test("Repository created", () => {
  const data = pm.response.json().data;
  pm.expect(data.createRepository).to.exist;
  pm.expect(data.createRepository.repository).to.exist;
});

pm.test("Repository has correct name", () => {
  const repo = pm.response.json().data.createRepository.repository;
  pm.expect(repo.name).to.equal("my-new-repo");
});

pm.test("No GraphQL errors", () => {
  const json = pm.response.json();
  pm.expect(json.errors).to.be.undefined;
});

// Save repo ID for cleanup
const repoId = pm.response.json().data.createRepository.repository.id;
pm.environment.set("createdRepoId", repoId);
```

### GitHub API: Add Star

```graphql
mutation AddStar($input: AddStarInput!) {
  addStar(input: $input) {
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
  "input": {
    "starrableId": "MDEwOlJlcG9zaXRvcnkxMDI3MDI1MA=="
  }
}
```

### GitHub API: Create Issue

```graphql
mutation CreateIssue($input: CreateIssueInput!) {
  createIssue(input: $input) {
    issue {
      id
      number
      title
      url
      state
      author {
        login
      }
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "repositoryId": "R_kgDOBP7V8g",
    "title": "Bug: Login not working",
    "body": "When I try to login, I get a 500 error.",
    "labelIds": ["LA_kwDOBP7V8s8AAAABP3YTdA"]
  }
}
```

**Test:**
```javascript
pm.test("Issue created", () => {
  const issue = pm.response.json().data.createIssue.issue;
  pm.expect(issue).to.exist;
  pm.expect(issue.number).to.be.a('number');
  pm.expect(issue.state).to.equal('OPEN');
});

// Save issue number for follow-up
const issueNumber = pm.response.json().data.createIssue.issue.number;
pm.environment.set("lastIssueNumber", issueNumber);
```

### GitHub API: Close Issue

```graphql
mutation CloseIssue($input: CloseIssueInput!) {
  closeIssue(input: $input) {
    issue {
      id
      state
      closedAt
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "issueId": "I_kwDOBP7V8s5XYZ"
  }
}
```

### GitHub API: Add Comment

```graphql
mutation AddComment($input: AddCommentInput!) {
  addComment(input: $input) {
    subject {
      id
    }
    commentEdge {
      node {
        id
        body
        createdAt
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
  "input": {
    "subjectId": "I_kwDOBP7V8s5XYZ",
    "body": "Thanks for reporting! We'll look into this."
  }
}
```

---

## Error Handling

### Validation Errors

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
  }
}
```

**Variables (invalid email):**
```json
{
  "input": {
    "name": "John",
    "email": "not-an-email"
  }
}
```

**Response:**
```json
{
  "errors": [
    {
      "message": "Validation error",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "field": "email",
        "validationError": "Invalid email format"
      }
    }
  ]
}
```

### Business Logic Errors

```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id) {
    success
    message
  }
}
```

**Response (user has posts):**
```json
{
  "data": {
    "deleteUser": null
  },
  "errors": [
    {
      "message": "Cannot delete user with existing posts",
      "extensions": {
        "code": "BUSINESS_LOGIC_ERROR",
        "userId": "123",
        "postCount": 5
      }
    }
  ]
}
```

### Testing Error Handling

```javascript
pm.test("Handle validation errors", () => {
  const json = pm.response.json();
  
  if (json.errors) {
    const error = json.errors[0];
    
    // Check error structure
    pm.expect(error).to.have.property('message');
    pm.expect(error.extensions).to.exist;
    
    // Check error code
    pm.expect(error.extensions.code).to.be.oneOf([
      'BAD_USER_INPUT',
      'BUSINESS_LOGIC_ERROR',
      'UNAUTHENTICATED',
      'FORBIDDEN'
    ]);
    
    // Log for debugging
    console.log("Error:", error.message);
    console.log("Code:", error.extensions.code);
  }
});
```

---

## Mutation Testing Patterns

### Complete Test Suite

```javascript
// Test successful mutation
pm.test("Mutation successful", () => {
  pm.response.to.have.status(200);
  
  const json = pm.response.json();
  pm.expect(json.errors).to.be.undefined;
  pm.expect(json.data.createUser).to.exist;
});

// Test returned data
pm.test("Created user has correct fields", () => {
  const user = pm.response.json().data.createUser;
  
  pm.expect(user).to.have.property('id');
  pm.expect(user.id).to.be.a('string').and.not.empty;
  
  pm.expect(user).to.have.property('name');
  pm.expect(user.name).to.equal(pm.variables.get('userName'));
  
  pm.expect(user).to.have.property('createdAt');
});

// Test data types
pm.test("Fields have correct types", () => {
  const user = pm.response.json().data.createUser;
  
  pm.expect(user.id).to.be.a('string');
  pm.expect(user.name).to.be.a('string');
  pm.expect(user.email).to.be.a('string');
  pm.expect(user.isActive).to.be.a('boolean');
});

// Test timestamp
pm.test("CreatedAt is recent", () => {
  const user = pm.response.json().data.createUser;
  const createdAt = new Date(user.createdAt);
  const now = new Date();
  const diff = now - createdAt;
  
  // Created within last 5 seconds
  pm.expect(diff).to.be.below(5000);
});

// Test business logic
pm.test("New user is active by default", () => {
  const user = pm.response.json().data.createUser;
  pm.expect(user.isActive).to.be.true;
});

// Save for cleanup or next request
const userId = pm.response.json().data.createUser.id;
pm.environment.set("lastCreatedUserId", userId);
pm.collectionVariables.set("testUserId", userId);
```

### Test Update Mutation

```javascript
pm.test("Update successful", () => {
  const json = pm.response.json();
  pm.expect(json.errors).to.be.undefined;
  pm.expect(json.data.updateUser).to.exist;
});

pm.test("Only specified fields updated", () => {
  const user = pm.response.json().data.updateUser;
  
  // These should change
  pm.expect(user.name).to.equal("Updated Name");
  
  // These should not change
  pm.expect(user.id).to.equal(pm.variables.get('userId'));
  pm.expect(user.email).to.equal(pm.variables.get('userEmail'));
});

pm.test("UpdatedAt timestamp changed", () => {
  const user = pm.response.json().data.updateUser;
  const updatedAt = new Date(user.updatedAt);
  const createdAt = new Date(user.createdAt);
  
  pm.expect(updatedAt).to.be.above(createdAt);
});
```

### Test Delete Mutation

```javascript
pm.test("Delete successful", () => {
  const result = pm.response.json().data.deleteUser;
  pm.expect(result.success).to.be.true;
  pm.expect(result.message).to.exist;
});

pm.test("Returns deleted ID", () => {
  const result = pm.response.json().data.deleteUser;
  pm.expect(result.deletedId).to.equal(pm.variables.get('userId'));
});

// Verify deletion in next request
pm.test("Cleanup environment", () => {
  pm.environment.unset("userId");
});
```

---

## Using Simba Variables

### Environment Variables in Mutations

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    author {
      name
    }
  }
}
```

**Variables (using Simba {{variables}}):**
```json
{
  "input": {
    "title": "{{postTitle}}",
    "content": "{{postContent}}",
    "authorId": "{{currentUserId}}"
  }
}
```

### Pre-request Script to Generate Data

```javascript
// Generate random data
const randomEmail = `user${Date.now()}@example.com`;
const randomName = `User ${Math.floor(Math.random() * 1000)}`;

// Set as variables
pm.variables.set('randomEmail', randomEmail);
pm.variables.set('randomName', randomName);

// Or set GraphQL variables directly
const variables = {
  input: {
    name: randomName,
    email: randomEmail,
    password: 'test123'
  }
};

pm.variables.set('graphqlVariables', JSON.stringify(variables));
```

**Query using generated data:**
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "{{randomName}}",
    "email": "{{randomEmail}}",
    "password": "test123"
  }
}
```

---

## Advanced Patterns

### Optimistic Response

In client code (not Simba), you can optimistically update UI:

```graphql
mutation LikePost($postId: ID!) {
  likePost(postId: $postId) {
    id
    likes
    isLikedByViewer
  }
}
```

### Batch Mutations

Some APIs support batch operations:

```graphql
mutation CreateMultiplePosts($inputs: [CreatePostInput!]!) {
  createPosts(inputs: $inputs) {
    posts {
      id
      title
    }
    errors {
      index
      message
    }
  }
}
```

**Variables:**
```json
{
  "inputs": [
    { "title": "Post 1", "content": "..." },
    { "title": "Post 2", "content": "..." },
    { "title": "Post 3", "content": "..." }
  ]
}
```

### Conditional Mutations

Use directives for conditional execution:

```graphql
mutation UpdateUser($userId: ID!, $input: UserInput!, $notify: Boolean!) {
  updateUser(id: $userId, input: $input) {
    id
    name
    
    # Only fetch notifications if needed
    notifications @include(if: $notify) {
      unreadCount
    }
  }
}
```

---

## Best Practices

### 1. Always Use Variables

❌ **Bad** - Hard-coded values:
```graphql
mutation {
  createUser(name: "John", email: "john@example.com") {
    id
  }
}
```

✅ **Good** - Use variables:
```graphql
mutation CreateUser($name: String!, $email: String!) {
  createUser(name: $name, email: $email) {
    id
  }
}
```

### 2. Request Useful Data Back

❌ **Bad** - Only request success boolean:
```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    success
  }
}
```

✅ **Good** - Request created object:
```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    slug
    createdAt
    author {
      id
      name
    }
  }
}
```

### 3. Use Input Types

❌ **Bad** - Many separate arguments:
```graphql
mutation CreateUser(
  $name: String!
  $email: String!
  $bio: String
  $website: String
  $location: String
) {
  createUser(name: $name, email: $email, bio: $bio, ...) {
    id
  }
}
```

✅ **Good** - Single input object:
```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
  }
}
```

### 4. Handle Errors Gracefully

```javascript
const json = pm.response.json();

if (json.errors) {
  json.errors.forEach(error => {
    console.error(`Error: ${error.message}`);
    
    if (error.extensions) {
      console.error(`Code: ${error.extensions.code}`);
      console.error(`Details:`, error.extensions);
    }
  });
  
  pm.expect(json.errors).to.be.empty;
}
```

### 5. Clean Up Test Data

```javascript
// After creating test data
const userId = pm.response.json().data.createUser.id;

// Add to cleanup list
const cleanup = pm.collectionVariables.get("cleanup") || [];
cleanup.push({ type: "user", id: userId });
pm.collectionVariables.set("cleanup", cleanup);

// In teardown request:
const cleanup = pm.collectionVariables.get("cleanup") || [];
cleanup.forEach(item => {
  // Delete each item
});
```

---

## Troubleshooting

### Issue: Input Validation Failed

**Error:**
```json
{
  "errors": [{
    "message": "Variable \"$input\" got invalid value ...",
    "extensions": {
      "code": "BAD_USER_INPUT"
    }
  }]
}
```

**Solutions:**
- Check input types match schema
- Verify required fields are provided
- Ensure type conversions (string vs number)

### Issue: Unauthorized

**Error:**
```json
{
  "errors": [{
    "message": "Not authorized",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }]
}
```

**Solutions:**
- Add authentication header
- Check token is valid
- Verify permissions

### Issue: Unique Constraint Violation

**Error:**
```json
{
  "errors": [{
    "message": "Email already exists",
    "extensions": {
      "code": "CONSTRAINT_VIOLATION",
      "field": "email"
    }
  }]
}
```

**Solutions:**
- Use unique values (timestamp, UUID)
- Check before creating
- Use upsert instead of create

### Issue: Mutation Returned Null

**Response:**
```json
{
  "data": {
    "updateUser": null
  },
  "errors": [{
    "message": "User not found"
  }]
}
```

**Solutions:**
- Verify ID exists
- Check permissions
- Resource might be deleted

---

## Mutation Workflow Examples

### Create → Read → Update → Delete

**1. Create User:**
```graphql
mutation CreateUser {
  createUser(input: {
    name: "Test User"
    email: "test@example.com"
  }) {
    id
    name
  }
}
```

**2. Read User:**
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    createdAt
  }
}
```

**3. Update User:**
```graphql
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    updatedAt
  }
}
```

**4. Delete User:**
```graphql
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id) {
    success
    deletedId
  }
}
```

### Relationship Management

**1. Create parent:**
```graphql
mutation CreateUser {
  createUser(input: { name: "John" }) {
    id
  }
}
```

**2. Create child:**
```graphql
mutation CreatePost($authorId: ID!) {
  createPost(input: {
    title: "My Post"
    authorId: $authorId
  }) {
    id
    title
    author {
      name
    }
  }
}
```

**3. Link existing:**
```graphql
mutation AddPostTag($postId: ID!, $tagId: ID!) {
  addPostTag(postId: $postId, tagId: $tagId) {
    post {
      id
      tags {
        name
      }
    }
  }
}
```

---

## Next Steps

- **[Variables](variables.md)** - Master GraphQL variables
- **[Schema Explorer](schema-explorer.md)** - Discover mutation types
- **[Queries](queries.md)** - Read data after mutations
- **[Tutorial](../../tutorials/graphql-testing.md)** - Complete workflow

## Related Topics

- [GraphQL Overview](overview.md)
- [Test Scripts](../../advanced/test-scripts.md)
- [Pre-request Scripts](../../advanced/pre-request-scripts.md)
- [Authentication](../../authentication/bearer-token.md)
