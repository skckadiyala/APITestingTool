# GraphQL Schema Explorer

Discover and explore GraphQL APIs using introspection and schema documentation.

---

## What is Introspection?

**Introspection** is a powerful GraphQL feature that allows you to query the API schema itself. You can discover:
- Available types
- Fields on each type
- Arguments for fields
- Documentation and descriptions
- Deprecated fields
- Directives

This is like having interactive API documentation built into the API itself.

---

## Why Use Schema Exploration?

### Benefits

✅ **Self-Documentation** - No separate docs needed  
✅ **Always Up-to-Date** - Schema reflects current API  
✅ **Type Discovery** - See all available types  
✅ **Field Discovery** - Find fields you can query  
✅ **Auto-completion** - Build queries faster  
✅ **Validation** - Catch errors before sending  

### Use Cases

- **Learning New APIs** - Explore structure
- **Building Queries** - Find available fields
- **Code Generation** - Generate types/interfaces
- **Documentation** - Auto-generate docs
- **Testing** - Validate schema changes

---

## Using Schema Explorer in Simba

### Opening Schema Explorer

1. Create a new GraphQL request
2. Enter the GraphQL endpoint URL
3. Add authentication (if needed)
4. Click **"Schema Explorer"** button
5. Simba automatically runs introspection query

### Features

- **Type Browser** - Browse all types
- **Field Inspector** - See fields, arguments, types
- **Documentation** - Read inline descriptions
- **Search** - Find types by name
- **Deprecation Warnings** - See deprecated fields
- **Nested Exploration** - Click types to explore

---

## Introspection Query

### Basic Introspection

This is what Simba runs automatically:

```graphql
query IntrospectionQuery {
  __schema {
    queryType {
      name
    }
    mutationType {
      name
    }
    subscriptionType {
      name
    }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type {
    ...TypeRef
  }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
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

### Simplified Introspection

For exploring manually:

```graphql
{
  __schema {
    types {
      name
      kind
      description
    }
  }
}
```

---

## Exploring Schema Components

### Query Root Type

Find all available queries:

```graphql
{
  __schema {
    queryType {
      name
      fields {
        name
        description
        args {
          name
          type {
            name
            kind
          }
        }
        type {
          name
          kind
        }
      }
    }
  }
}
```

**Example Response:**
```json
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query",
        "fields": [
          {
            "name": "user",
            "description": "Get user by ID",
            "args": [
              {
                "name": "id",
                "type": {
                  "name": null,
                  "kind": "NON_NULL"
                }
              }
            ],
            "type": {
              "name": "User",
              "kind": "OBJECT"
            }
          }
        ]
      }
    }
  }
}
```

### Mutation Root Type

Find all available mutations:

```graphql
{
  __schema {
    mutationType {
      name
      fields {
        name
        description
        args {
          name
          type {
            name
          }
        }
      }
    }
  }
}
```

### Specific Type Details

Get details about a specific type:

```graphql
{
  __type(name: "User") {
    name
    kind
    description
    fields {
      name
      description
      type {
        name
        kind
      }
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "__type": {
      "name": "User",
      "kind": "OBJECT",
      "description": "A user in the system",
      "fields": [
        {
          "name": "id",
          "description": "Unique identifier",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "name",
          "description": "User's full name",
          "type": {
            "name": "String",
            "kind": "SCALAR"
          }
        }
      ]
    }
  }
}
```

### Enum Values

Explore enum options:

```graphql
{
  __type(name: "PostStatus") {
    name
    enumValues {
      name
      description
      isDeprecated
      deprecationReason
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "__type": {
      "name": "PostStatus",
      "enumValues": [
        {
          "name": "DRAFT",
          "description": "Post is in draft mode",
          "isDeprecated": false,
          "deprecationReason": null
        },
        {
          "name": "PUBLISHED",
          "description": "Post is published",
          "isDeprecated": false,
          "deprecationReason": null
        },
        {
          "name": "ARCHIVED",
          "description": "Post is archived",
          "isDeprecated": false,
          "deprecationReason": null
        }
      ]
    }
  }
}
```

### Input Types

See input object fields:

```graphql
{
  __type(name: "CreateUserInput") {
    name
    kind
    inputFields {
      name
      description
      type {
        name
        kind
      }
      defaultValue
    }
  }
}
```

---

## Type System

### Type Kinds

GraphQL has several type kinds:

| Kind | Description | Example |
|------|-------------|---------|
| **SCALAR** | Basic data types | String, Int, Float, Boolean, ID |
| **OBJECT** | Complex types with fields | User, Post, Comment |
| **INTERFACE** | Abstract type | Node, Timestamped |
| **UNION** | One of several types | SearchResult (Post \| User) |
| **ENUM** | Set of values | PostStatus, Role |
| **INPUT_OBJECT** | Input for mutations | CreateUserInput |
| **LIST** | Array of types | [User], [String!] |
| **NON_NULL** | Required type | String!, ID! |

### Type Wrappers

Types can be wrapped to indicate nullability and lists:

```graphql
# Nullable scalar
String

# Required scalar
String!

# Nullable list of nullable strings
[String]

# Required list of nullable strings
[String]!

# Nullable list of required strings
[String!]

# Required list of required strings
[String!]!
```

**Understanding the syntax:**

```graphql
String          # Can be null: null, "hello"
String!         # Cannot be null: "hello"
[String]        # Can be null or list: null, [], ["a", null]
[String]!       # Cannot be null but list can have nulls: [], ["a", null]
[String!]       # Can be null but list items can't: null, [], ["a", "b"]
[String!]!      # Nothing can be null: [], ["a", "b"]
```

---

## Real-World Examples

### GitHub API Schema Exploration

**Explore Repository type:**

```graphql
{
  __type(name: "Repository") {
    name
    description
    fields {
      name
      description
      type {
        name
        kind
      }
      args {
        name
        description
        type {
          name
        }
      }
    }
  }
}
```

**Find all mutations:**

```graphql
{
  __schema {
    mutationType {
      fields {
        name
        description
      }
    }
  }
}
```

**Explore specific mutation:**

```graphql
{
  __type(name: "Mutation") {
    fields(includeDeprecated: false) {
      name
      description
      args {
        name
        description
        type {
          name
        }
      }
    }
  }
}
```

---

## Building Queries from Schema

### Step 1: Find Root Queries

```graphql
{
  __schema {
    queryType {
      fields {
        name
        description
      }
    }
  }
}
```

**Result:** Available queries like `user`, `users`, `repository`, etc.

### Step 2: Explore Query Arguments

```graphql
{
  __type(name: "Query") {
    fields {
      name
      args {
        name
        type {
          name
          kind
        }
      }
    }
  }
}
```

**Example:** `user(id: ID!)` requires an ID argument.

### Step 3: Explore Return Type

```graphql
{
  __type(name: "User") {
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

**Result:** User has fields: id, name, email, posts, etc.

### Step 4: Build Query

```graphql
query GetUser {
  user(id: "123") {
    id
    name
    email
    posts {
      title
    }
  }
}
```

---

## Schema Documentation

### Reading Descriptions

GraphQL schemas can include descriptions:

```graphql
"""
Represents a user in the system.
Users can create posts and comments.
"""
type User {
  """
  Unique identifier for the user.
  This ID is stable and never changes.
  """
  id: ID!
  
  """
  The user's full name.
  Maximum length: 100 characters.
  """
  name: String!
  
  """
  User's email address.
  Must be unique and valid.
  """
  email: String!
}
```

**Introspection captures these:**

```graphql
{
  __type(name: "User") {
    description
    fields {
      name
      description
    }
  }
}
```

### Deprecation

```graphql
type User {
  id: ID!
  fullName: String!
  name: String! @deprecated(reason: "Use fullName instead")
}
```

**Find deprecated fields:**

```graphql
{
  __type(name: "User") {
    fields(includeDeprecated: true) {
      name
      isDeprecated
      deprecationReason
    }
  }
}
```

---

## Schema Comparison

### Detecting Changes

Run introspection before and after updates:

```javascript
// Save current schema
const schema = pm.response.json().data.__schema;
pm.collectionVariables.set('oldSchema', JSON.stringify(schema));

// Compare later
const oldSchema = JSON.parse(pm.collectionVariables.get('oldSchema'));
const newSchema = pm.response.json().data.__schema;

// Check for removed types
const oldTypes = oldSchema.types.map(t => t.name);
const newTypes = newSchema.types.map(t => t.name);
const removedTypes = oldTypes.filter(t => !newTypes.includes(t));

if (removedTypes.length > 0) {
  console.log('Removed types:', removedTypes);
}
```

### Breaking Changes

```javascript
pm.test("No breaking changes", () => {
  const oldSchema = JSON.parse(pm.collectionVariables.get('oldSchema'));
  const newSchema = pm.response.json().data.__schema;
  
  // Check if Query type still exists
  pm.expect(newSchema.queryType).to.exist;
  
  // Check critical fields
  const oldQueryFields = oldSchema.queryType.fields.map(f => f.name);
  const newQueryFields = newSchema.queryType.fields.map(f => f.name);
  
  oldQueryFields.forEach(field => {
    pm.expect(newQueryFields).to.include(field, 
      `Query.${field} was removed!`);
  });
});
```

---

## Advanced Introspection

### Custom Directives

```graphql
{
  __schema {
    directives {
      name
      description
      locations
      args {
        name
        type {
          name
        }
      }
    }
  }
}
```

**Common directives:**
- `@deprecated` - Mark fields as deprecated
- `@include(if: Boolean!)` - Include field conditionally
- `@skip(if: Boolean!)` - Skip field conditionally
- `@specifiedBy` - Link to scalar specification

### Interfaces

```graphql
{
  __type(name: "Node") {
    name
    kind
    description
    possibleTypes {
      name
    }
  }
}
```

**Result:**
```json
{
  "data": {
    "__type": {
      "name": "Node",
      "kind": "INTERFACE",
      "description": "An object with an ID",
      "possibleTypes": [
        { "name": "User" },
        { "name": "Post" },
        { "name": "Comment" }
      ]
    }
  }
}
```

### Unions

```graphql
{
  __type(name: "SearchResult") {
    name
    kind
    possibleTypes {
      name
      description
    }
  }
}
```

---

## Schema Validation

### Test Schema Health

```javascript
pm.test("Schema is valid", () => {
  const schema = pm.response.json().data.__schema;
  
  // Has query type
  pm.expect(schema.queryType).to.exist;
  pm.expect(schema.queryType.name).to.equal('Query');
  
  // Has types
  pm.expect(schema.types).to.be.an('array');
  pm.expect(schema.types.length).to.be.above(0);
  
  // Has standard scalars
  const typeNames = schema.types.map(t => t.name);
  ['String', 'Int', 'Float', 'Boolean', 'ID'].forEach(scalar => {
    pm.expect(typeNames).to.include(scalar);
  });
});
```

### Test Required Fields

```javascript
pm.test("User type has required fields", () => {
  const schema = pm.response.json().data.__schema;
  const userType = schema.types.find(t => t.name === 'User');
  
  pm.expect(userType).to.exist;
  
  const fieldNames = userType.fields.map(f => f.name);
  ['id', 'name', 'email'].forEach(field => {
    pm.expect(fieldNames).to.include(field);
  });
});
```

---

## Disabling Introspection

Some production APIs disable introspection for security:

```graphql
{
  __schema {
    types {
      name
    }
  }
}
```

**Response:**
```json
{
  "errors": [{
    "message": "GraphQL introspection is not allowed, but the query contained __schema or __type"
  }]
}
```

**Workarounds:**
- Use development/staging endpoint
- Request schema file from API team
- Use public documentation
- Contact API support

---

## Schema Generation Tools

### Generate TypeScript Types

Use schema to generate types:

```typescript
// Generated from schema
type User = {
  id: string;
  name: string;
  email: string | null;
  posts: Post[];
};

type Post = {
  id: string;
  title: string;
  content: string | null;
  author: User;
};
```

### Generate GraphQL Fragments

```graphql
# Auto-generate from User type
fragment UserFields on User {
  id
  name
  email
  createdAt
}
```

### Generate Documentation

Create API docs from schema:

```markdown
# User

A user in the system.

## Fields

- `id: ID!` - Unique identifier
- `name: String!` - User's full name
- `email: String` - User's email (nullable)
- `posts: [Post!]!` - User's posts
```

---

## Best Practices

### 1. Explore Schema First

Before writing queries:
1. Run introspection
2. Browse available types
3. Check field arguments
4. Read descriptions

### 2. Check Deprecations

```graphql
{
  __type(name: "User") {
    fields(includeDeprecated: true) {
      name
      isDeprecated
      deprecationReason
    }
  }
}
```

### 3. Understand Type Relationships

Map out object relationships:

```
User
  ├─ posts: [Post!]!
  │   └─ comments: [Comment!]!
  │       └─ author: User!
  └─ followers: [User!]!
```

### 4. Save Common Fragments

```graphql
# Save as collection variable
fragment UserPreview on User {
  id
  name
  avatarUrl
}
```

### 5. Version Control Schema

```javascript
// Export schema to file
const schema = pm.response.json().data.__schema;
const timestamp = new Date().toISOString();
const filename = `schema-${timestamp}.json`;

// In actual use, save to version control
console.log('Schema snapshot:', JSON.stringify(schema, null, 2));
```

---

## Troubleshooting

### Issue: Introspection Disabled

**Error:** "GraphQL introspection is not allowed"

**Solutions:**
1. Use development endpoint
2. Request schema file
3. Use different environment
4. Contact API support

### Issue: Large Schema Response

**Problem:** Schema introspection times out or returns huge response.

**Solution:** Query specific types:

```graphql
# Instead of full schema
{
  __type(name: "Query") {
    fields {
      name
    }
  }
}
```

### Issue: Type Not Found

```graphql
{
  __type(name: "Usr") {  # Typo
    name
  }
}
```

**Response:**
```json
{
  "data": {
    "__type": null
  }
}
```

**Solution:** Fix typo or list all types first:

```graphql
{
  __schema {
    types {
      name
    }
  }
}
```

---

## Schema Explorer Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search types | `Ctrl/Cmd + F` |
| Expand type | `→` or `Enter` |
| Collapse type | `←` or `Backspace` |
| Navigate | `↑` `↓` |
| Go to definition | `Ctrl/Cmd + Click` |
| Copy type name | `Ctrl/Cmd + C` |

---

## Schema Documentation Standards

### Good Schema Design

```graphql
"""
A blog post created by a user.
Posts can have multiple comments and tags.
"""
type Post {
  """
  Unique identifier.
  Format: UUID v4
  """
  id: ID!
  
  """
  Post title.
  Max length: 200 characters
  Required for all posts
  """
  title: String!
  
  """
  Post content in Markdown format.
  Can be empty for draft posts.
  """
  content: String
  
  """
  Publication timestamp.
  Null for draft posts.
  """
  publishedAt: DateTime
  
  """
  Post author.
  Never null - posts always have an author.
  """
  author: User!
  
  """
  Post tags for categorization.
  Empty array for untagged posts.
  """
  tags: [Tag!]!
}
```

---

## Next Steps

- **[Queries](queries.md)** - Build queries using schema
- **[Mutations](mutations.md)** - Discover available mutations
- **[Variables](variables.md)** - Use correct types from schema
- **[Tutorial](../../tutorials/graphql-testing.md)** - Complete workflow

## Related Topics

- [GraphQL Overview](overview.md)
- [Test Scripts](../../advanced/test-scripts.md)
- [Collection Organization](../../concepts/collections.md)
- [API Documentation](../../concepts/documentation.md)
