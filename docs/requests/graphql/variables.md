# GraphQL Variables

Master GraphQL variables to write reusable, dynamic queries and mutations.

---

## What are GraphQL Variables?

**Variables** make GraphQL operations dynamic and reusable. Instead of hard-coding values in your queries, you define variables that can be passed separately.

### Benefits

✅ **Reusability** - Same query with different inputs  
✅ **Type Safety** - Variables are strongly typed  
✅ **Security** - Prevent injection attacks  
✅ **Clean Code** - Separate data from query logic  
✅ **DRY Principle** - Don't repeat values  

---

## Basic Syntax

### Without Variables (Bad)

```graphql
query {
  user(id: "123") {
    name
    posts(limit: 10) {
      title
    }
  }
}
```

**Problems:**
- Hard to reuse with different IDs
- Values embedded in query string
- Must regenerate entire query to change values

### With Variables (Good)

**Query:**
```graphql
query GetUser($userId: ID!, $postLimit: Int) {
  user(id: $userId) {
    name
    posts(limit: $postLimit) {
      title
    }
  }
}
```

**Variables (JSON):**
```json
{
  "userId": "123",
  "postLimit": 10
}
```

---

## Variable Definition

### Syntax

```graphql
query OperationName($variableName: Type) {
  # Use variable
}
```

**Components:**
- `$variableName` - Variable name (starts with `$`)
- `Type` - GraphQL type (String, Int, ID, etc.)
- `!` - Required (non-null)

### Examples

```graphql
# Required variable
$userId: ID!

# Optional variable
$limit: Int

# Optional with default
$limit: Int = 10

# Required array
$userIds: [ID!]!

# Optional array of optional strings
$tags: [String]

# Input object
$input: CreateUserInput!
```

---

## Variable Types

### Scalar Types

```graphql
query Examples(
  $id: ID!,                # Unique identifier
  $name: String!,          # Text
  $age: Int,               # Integer
  $price: Float,           # Decimal
  $isActive: Boolean       # true/false
) {
  # ...
}
```

**Variables:**
```json
{
  "id": "abc123",
  "name": "John Doe",
  "age": 30,
  "price": 19.99,
  "isActive": true
}
```

### List Types

```graphql
query SearchUsers(
  $ids: [ID!]!,            # Required array of required IDs
  $tags: [String],         # Optional array of optional strings
  $scores: [Int!]          # Optional array of required integers
) {
  # ...
}
```

**Variables:**
```json
{
  "ids": ["1", "2", "3"],
  "tags": ["admin", null, "editor"],
  "scores": [85, 90, 78]
}
```

### Enum Types

```graphql
query GetPosts(
  $status: PostStatus!,      # DRAFT, PUBLISHED, ARCHIVED
  $orderBy: SortOrder        # ASC, DESC
) {
  posts(status: $status, orderBy: $orderBy) {
    title
  }
}
```

**Variables:**
```json
{
  "status": "PUBLISHED",
  "orderBy": "DESC"
}
```

### Input Object Types

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
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
    }
  }
}
```

---

## Default Values

### Query-level Defaults

```graphql
query GetPosts(
  $limit: Int = 10,
  $offset: Int = 0,
  $status: PostStatus = PUBLISHED
) {
  posts(limit: $limit, offset: $offset, status: $status) {
    title
  }
}
```

**Variables (empty):**
```json
{}
```
Uses defaults: `limit: 10`, `offset: 0`, `status: PUBLISHED`

**Variables (partial):**
```json
{
  "limit": 5
}
```
Uses: `limit: 5`, `offset: 0` (default), `status: PUBLISHED` (default)

### When to Use Defaults

✅ **Good cases:**
- Common values (pagination limits)
- Reasonable fallbacks
- Optional filters

❌ **Avoid for:**
- Security-critical values
- Business logic
- User-specific data

---

## Using Simba Variables

Simba has its own variable system (`{{varName}}`) that works alongside GraphQL variables.

### Simba Variables in GraphQL Variables

**Recommended approach:**

**Environment/Collection Variables:**
```json
{
  "userId": "12345",
  "repoOwner": "facebook",
  "repoName": "react"
}
```

**GraphQL Query:**
```graphql
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    stargazerCount
  }
}
```

**GraphQL Variables (using Simba variables):**
```json
{
  "owner": "{{repoOwner}}",
  "name": "{{repoName}}"
}
```

**Flow:**
1. Simba resolves `{{repoOwner}}` → `"facebook"`
2. Simba resolves `{{repoName}}` → `"react"`
3. GraphQL receives:
```json
{
  "owner": "facebook",
  "name": "react"
}
```

### Simba Variables Directly in Query (Not Recommended)

```graphql
query GetUser {
  user(id: "{{userId}}") {
    name
  }
}
```

**Why avoid this:**
- Loses GraphQL type safety
- Can't reuse query with different values easily
- Mixing two variable systems

### Pre-request Script Generation

```javascript
// Generate dynamic values
const timestamp = Date.now();
const randomId = Math.floor(Math.random() * 1000);

// Set as Simba variables
pm.variables.set('timestamp', timestamp);
pm.variables.set('randomId', randomId);

// Set entire GraphQL variables object
const graphqlVars = {
  input: {
    name: `User ${randomId}`,
    email: `user${timestamp}@example.com`
  }
};
pm.variables.set('graphqlVariables', JSON.stringify(graphqlVars));
```

**Use in Variables panel:**
```json
{
  "input": {
    "name": "User {{randomId}}",
    "email": "user{{timestamp}}@example.com"
  }
}
```

---

## Complex Variable Examples

### Nested Input Objects

```graphql
mutation CreateBlogPost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    author { name }
    tags { name }
  }
}
```

**Variables:**
```json
{
  "input": {
    "title": "GraphQL Variables Guide",
    "content": "Learn how to use GraphQL variables...",
    "author": {
      "connect": {
        "id": "user123"
      }
    },
    "tags": {
      "create": [
        { "name": "graphql" },
        { "name": "tutorial" }
      ]
    },
    "metadata": {
      "featured": true,
      "publishedAt": "2024-04-16T10:00:00Z"
    }
  }
}
```

### Multiple Operations with Shared Variables

```graphql
# Define both query and mutation
query GetUser($userId: ID!) {
  user(id: $userId) {
    name
    email
  }
}

mutation UpdateUser($userId: ID!, $input: UpdateUserInput!) {
  updateUser(id: $userId, input: $input) {
    name
    updatedAt
  }
}
```

To execute specific operation:
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
  "userId": "123"
}
```

### Filter Objects

```graphql
query SearchPosts($filter: PostFilterInput!) {
  posts(filter: $filter) {
    edges {
      node {
        title
        publishedAt
      }
    }
  }
}
```

**Variables:**
```json
{
  "filter": {
    "AND": [
      {
        "title": {
          "contains": "GraphQL"
        }
      },
      {
        "publishedAt": {
          "gte": "2024-01-01T00:00:00Z"
        }
      },
      {
        "OR": [
          {
            "category": {
              "equals": "tutorial"
            }
          },
          {
            "tags": {
              "some": {
                "name": {
                  "in": ["graphql", "api"]
                }
              }
            }
          }
        ]
      }
    ]
  }
}
```

---

## Real-World Examples

### GitHub API: Create Repository

```graphql
mutation CreateRepository(
  $name: String!,
  $description: String,
  $visibility: RepositoryVisibility!,
  $hasIssues: Boolean = true
) {
  createRepository(input: {
    name: $name
    description: $description
    visibility: $visibility
    hasIssuesEnabled: $hasIssues
  }) {
    repository {
      id
      name
      url
    }
  }
}
```

**Variables:**
```json
{
  "name": "my-awesome-project",
  "description": "A test repository",
  "visibility": "PUBLIC"
}
```

**Test:**
```javascript
pm.test("Repository created with correct name", () => {
  const repo = pm.response.json().data.createRepository.repository;
  pm.expect(repo.name).to.equal(pm.variables.get('repoName'));
});

// Save for cleanup
pm.environment.set('lastRepoId', repo.id);
```

### GitHub API: Paginated Query

```graphql
query GetRepositories(
  $owner: String!,
  $first: Int = 10,
  $after: String
) {
  user(login: $owner) {
    repositories(
      first: $first,
      after: $after,
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      edges {
        cursor
        node {
          name
          stargazerCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

**First page:**
```json
{
  "owner": "torvalds",
  "first": 5
}
```

**Next page:**
```javascript
// In test script
const pageInfo = pm.response.json().data.user.repositories.pageInfo;
if (pageInfo.hasNextPage) {
  pm.environment.set('nextCursor', pageInfo.endCursor);
}
```

**Second request:**
```json
{
  "owner": "torvalds",
  "first": 5,
  "after": "{{nextCursor}}"
}
```

### GitHub API: Search with Filters

```graphql
query SearchRepositories(
  $query: String!,
  $first: Int = 10,
  $type: SearchType = REPOSITORY
) {
  search(query: $query, type: $type, first: $first) {
    repositoryCount
    edges {
      node {
        ... on Repository {
          name
          description
          stargazerCount
          primaryLanguage {
            name
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
  "query": "language:javascript stars:>1000 fork:false",
  "first": 20
}
```

---

## Testing with Variables

### Test Variable Types

```javascript
pm.test("Variables have correct types", () => {
  const variables = JSON.parse(pm.request.body.graphql.variables || '{}');
  
  // Check types
  pm.expect(variables.userId).to.be.a('string');
  pm.expect(variables.limit).to.be.a('number');
  pm.expect(variables.isActive).to.be.a('boolean');
  pm.expect(variables.tags).to.be.an('array');
});
```

### Test Variable Resolution

```javascript
pm.test("Simba variables resolved", () => {
  const variables = JSON.parse(pm.request.body.graphql.variables || '{}');
  
  // Should not contain {{}} after resolution
  const jsonString = JSON.stringify(variables);
  pm.expect(jsonString).to.not.include('{{');
  pm.expect(jsonString).to.not.include('}}');
});
```

### Test Required Variables

```javascript
// Pre-request: Validate required variables
const requiredVars = ['userId', 'email'];
const missing = [];

requiredVars.forEach(varName => {
  const value = pm.variables.get(varName);
  if (!value) {
    missing.push(varName);
  }
});

if (missing.length > 0) {
  throw new Error(`Missing required variables: ${missing.join(', ')}`);
}
```

### Dynamic Variable Generation

```javascript
// Pre-request script
const now = new Date();

// Date filtering
pm.variables.set('startDate', new Date(now.setDate(now.getDate() - 7)).toISOString());
pm.variables.set('endDate', new Date().toISOString());

// Random data
pm.variables.set('randomInt', Math.floor(Math.random() * 100));
pm.variables.set('uuid', pm.variables.replaceIn('{{$guid}}'));

// Computed values
const limit = pm.variables.get('pageSize') || 10;
const offset = (pm.variables.get('currentPage') || 0) * limit;
pm.variables.set('offset', offset);
```

---

## Variable Patterns

### Pattern 1: Pagination State

```javascript
// Initialize pagination
pm.collectionVariables.set('currentPage', 0);
pm.collectionVariables.set('pageSize', 10);

// Calculate offset
const page = pm.collectionVariables.get('currentPage');
const size = pm.collectionVariables.get('pageSize');
pm.variables.set('offset', page * size);
```

**Query:**
```graphql
query GetItems($offset: Int!, $limit: Int!) {
  items(offset: $offset, limit: $limit) {
    id
    name
  }
  itemsCount
}
```

**Next page button logic (test script):**
```javascript
// Increment page
const currentPage = pm.collectionVariables.get('currentPage');
pm.collectionVariables.set('currentPage', currentPage + 1);
```

### Pattern 2: Filter Builder

```javascript
// Build filter from environment
const filters = {};

const status = pm.environment.get('filterStatus');
if (status) filters.status = status;

const category = pm.environment.get('filterCategory');
if (category) filters.category = category;

const minPrice = pm.environment.get('filterMinPrice');
if (minPrice) filters.price = { gte: parseFloat(minPrice) };

pm.variables.set('filters', JSON.stringify(filters));
```

**Query:**
```graphql
query SearchProducts($filters: ProductFilterInput) {
  products(filter: $filters) {
    id
    name
    price
  }
}
```

**Variables:**
```json
{
  "filters": {{filters}}
}
```

### Pattern 3: Batch Operations

```javascript
// Generate multiple items
const items = [];
for (let i = 0; i < 5; i++) {
  items.push({
    name: `Item ${i + 1}`,
    value: Math.random() * 100
  });
}

pm.variables.set('batchItems', JSON.stringify(items));
```

**Mutation:**
```graphql
mutation CreateItems($items: [CreateItemInput!]!) {
  createItems(inputs: $items) {
    count
    items {
      id
      name
    }
  }
}
```

---

## Error Handling

### Missing Required Variables

**Query:**
```graphql
query GetUser($userId: ID!) {
  user(id: $userId) {
    name
  }
}
```

**Variables (empty):**
```json
{}
```

**Error:**
```json
{
  "errors": [{
    "message": "Variable \"$userId\" of required type \"ID!\" was not provided."
  }]
}
```

### Type Mismatch

**Variables:**
```json
{
  "userId": 123  // Should be string
}
```

**Error:**
```json
{
  "errors": [{
    "message": "Variable \"$userId\" got invalid value 123; Expected type ID; ID cannot represent a non-string value: 123"
  }]
}
```

**Fix:**
```json
{
  "userId": "123"
}
```

### Invalid Input Object

**Variables:**
```json
{
  "input": {
    "name": "John"
    // Missing required field "email"
  }
}
```

**Error:**
```json
{
  "errors": [{
    "message": "Variable \"$input\" got invalid value { name: \"John\" }; Field value.email of required type String! was not provided."
  }]
}
```

---

## Best Practices

### 1. Always Use Variables for Dynamic Values

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

### 2. Use Descriptive Variable Names

❌ **Bad:**
```graphql
query GetPosts($n: Int, $s: String) {
  posts(limit: $n, sortBy: $s) { title }
}
```

✅ **Good:**
```graphql
query GetPosts($limit: Int, $sortBy: String) {
  posts(limit: $limit, sortBy: $sortBy) { title }
}
```

### 3. Set Sensible Defaults

```graphql
query GetPosts(
  $limit: Int = 10,      # Default page size
  $offset: Int = 0,      # Start at beginning
  $sortBy: String = "createdAt",
  $sortOrder: SortOrder = DESC
) {
  posts(limit: $limit, offset: $offset, sortBy: $sortBy, order: $sortOrder) {
    title
  }
}
```

### 4. Group Related Variables

❌ **Bad:**
```graphql
mutation CreateUser(
  $name: String!,
  $email: String!,
  $bio: String,
  $website: String
) {
  # ...
}
```

✅ **Good:**
```graphql
mutation CreateUser($input: CreateUserInput!) {
  # All fields in input object
}
```

### 5. Validate Before Sending

```javascript
// Pre-request validation
const email = pm.variables.get('email');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  throw new Error(`Invalid email format: ${email}`);
}
```

---

## Troubleshooting

### Issue: Variable Not Defined

**Query uses variable but not defined:**
```graphql
query GetUser {
  user(id: $userId) { name }  # ❌ $userId not defined
}
```

**Fix:**
```graphql
query GetUser($userId: ID!) {  # ✅ Define variable
  user(id: $userId) { name }
}
```

### Issue: Simba Variable Not Resolving

**Variables:**
```json
{
  "userId": "{{userId}}"
}
```

**After execution still shows `{{userId}}`:**

**Causes:**
1. Variable not set in environment/collection
2. Typo in variable name
3. Variable set in wrong scope

**Debug:**
```javascript
// Pre-request
console.log('userId =', pm.variables.get('userId'));
console.log('All variables:', pm.variables.toObject());
```

### Issue: JSON Syntax Error in Variables

**Invalid JSON:**
```json
{
  "name": "John",  # ❌ Comments not allowed
  tags: ['a', 'b']  # ❌ Keys must be quoted, use double quotes
}
```

**Fix:**
```json
{
  "name": "John",
  "tags": ["a", "b"]
}
```

---

## Variable Cheat Sheet

| Type | Definition | Example Value |
|------|------------|---------------|
| **String** | `$name: String!` | `"John Doe"` |
| **Int** | `$age: Int` | `30` |
| **Float** | `$price: Float` | `19.99` |
| **Boolean** | `$active: Boolean` | `true` |
| **ID** | `$id: ID!` | `"abc123"` |
| **Enum** | `$status: Status!` | `"ACTIVE"` |
| **List** | `$ids: [ID!]!` | `["1", "2"]` |
| **Input** | `$input: UserInput!` | `{ "name": "..." }` |
| **Optional** | `$name: String` | `null` or `"value"` |
| **Default** | `$limit: Int = 10` | Uses 10 if not provided |

---

## Next Steps

- **[Queries](queries.md)** - Use variables in queries
- **[Mutations](mutations.md)** - Use variables in mutations
- **[Schema Explorer](schema-explorer.md)** - See variable types
- **[Tutorial](../../tutorials/graphql-testing.md)** - Complete workflow

## Related Topics

- [GraphQL Overview](overview.md)
- [Pre-request Scripts](../../advanced/pre-request-scripts.md)
- [Variables Concept](../../concepts/variables.md)
- [Environments](../../collaboration/environments.md)
