# Full-Stack Code Review Skill

## Purpose
Perform comprehensive, production-grade code reviews for React + Express.js + TypeScript applications with actionable feedback prioritized by severity.

## When to Use
- Before merging pull requests
- During sprint reviews or code audits
- When evaluating code quality or technical debt
- Before production deployments
- When onboarding new features or refactoring

## Tech Stack Context
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Zustand, Monaco Editor
- **Backend:** Node.js, Express.js, TypeScript, Prisma (PostgreSQL), Mongoose (MongoDB)
- **Architecture:** Three-layer backend (routes → controllers → services), Component-based frontend

## Review Process

### Step 1: Architecture & Design Analysis

**Evaluate:**
- [ ] Overall structure: Is frontend/backend separation clear?
- [ ] Three-layer architecture adherence (routes → controllers → services)
- [ ] Component hierarchy and composition patterns
- [ ] Database strategy (PostgreSQL for metadata, MongoDB for large docs)
- [ ] State management approach (Zustand stores)
- [ ] Tight coupling or circular dependencies
- [ ] Anti-patterns or code smells

**Check For:**
- Services containing too much business logic
- Controllers handling business logic (should delegate to services)
- Components doing data fetching directly (should use stores/services)
- Mixed concerns (e.g., UI logic in business services)

**Output:** Architecture section with High/Medium/Low severity issues

---

### Step 2: Frontend (React) Review

**Component Quality:**
- [ ] Proper component decomposition (single responsibility)
- [ ] Reusability and composition patterns
- [ ] Props interface design (clear, typed, documented)
- [ ] Compound components where appropriate
- [ ] Separation of presentational vs container components

**State Management:**
- [ ] Zustand store organization (one store per domain)
- [ ] Store actions are properly typed
- [ ] No duplicated state across stores
- [ ] Proper use of useState/useEffect
- [ ] Avoid unnecessary re-renders (React.memo, useMemo, useCallback)

**Hooks Usage:**
- [ ] Custom hooks follow naming convention (useXxx)
- [ ] Hooks don't violate rules (conditional calls, order)
- [ ] Proper dependency arrays in useEffect
- [ ] Cleanup functions where needed (subscriptions, timers)

**Performance:**
- [ ] Large components split appropriately
- [ ] Heavy computations memoized (useMemo)
- [ ] List rendering optimized (keys, virtualization if needed)
- [ ] Code splitting and lazy loading for routes
- [ ] Bundle size considerations

**Accessibility:**
- [ ] Semantic HTML elements
- [ ] ARIA attributes where needed
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Screen reader compatibility

**Error Handling:**
- [ ] Error boundaries for critical sections
- [ ] User-friendly error messages
- [ ] Fallback UI states
- [ ] API error handling with toast notifications

**API Integration:**
- [ ] Centralized service layer (services/)
- [ ] Proper error handling and retries
- [ ] Loading states managed consistently
- [ ] Request cancellation on unmount

**Output:** Frontend section with specific file/line references and code snippets

---

### Step 3: Backend (Express.js + TypeScript) Review

**Route Structure:**
- [ ] Logical grouping by domain (auth, collections, requests, etc.)
- [ ] Consistent naming conventions
- [ ] Proper HTTP verbs (GET, POST, PUT, DELETE, PATCH)
- [ ] Route parameters and query params typed

**Middleware:**
- [ ] Authentication middleware applied correctly
- [ ] Input validation middleware (Zod schemas)
- [ ] Error handling middleware catches all errors
- [ ] Request logging middleware
- [ ] CORS configuration appropriate

**Controllers:**
- [ ] Controllers are thin (delegate to services)
- [ ] Request validation happens before business logic
- [ ] Responses are consistent (status codes, format)
- [ ] No business logic in controllers

**Services:**
- [ ] Business logic properly encapsulated
- [ ] Services are single-responsibility
- [ ] Database operations abstracted
- [ ] Reusable across multiple controllers
- [ ] No direct HTTP concerns (req/res)

**TypeScript Usage:**
- [ ] Strict mode enabled
- [ ] No `any` types (or justified usage)
- [ ] Interfaces for all data structures
- [ ] Proper type inference where possible
- [ ] Generic types used appropriately
- [ ] Type guards for runtime checks

**Async Handling:**
- [ ] All promises handled (no unhandled rejections)
- [ ] Proper async/await usage
- [ ] Error propagation works correctly
- [ ] No callback hell or promise chains

**Output:** Backend section with code quality issues and refactoring suggestions

---

### Step 4: Security Review

**Authentication & Authorization:**
- [ ] JWT implementation secure (secret management, expiration)
- [ ] Password hashing with bcrypt (proper salt rounds)
- [ ] Protected routes have auth middleware
- [ ] Authorization checks before sensitive operations
- [ ] Token refresh mechanism secure

**Vulnerability Protection:**
- [ ] XSS: Input sanitization and output encoding
- [ ] CSRF: Token validation for state-changing operations
- [ ] SQL Injection: Parameterized queries (Prisma handles this)
- [ ] NoSQL Injection: Input validation in MongoDB queries
- [ ] Path traversal: File upload validation

**API Security:**
- [ ] Rate limiting implemented (express-rate-limit)
- [ ] Security headers (helmet.js)
- [ ] CORS properly configured (not `*` in production)
- [ ] Request size limits
- [ ] Input validation on all endpoints

**Secrets Management:**
- [ ] No hardcoded secrets
- [ ] Environment variables used (.env)
- [ ] .env files in .gitignore
- [ ] Sensitive data not logged

**Output:** Security section with HIGH priority for vulnerabilities

---

### Step 5: Performance & Scalability Review

**Frontend Performance:**
- [ ] Large lists virtualized or paginated
- [ ] Images optimized and lazy-loaded
- [ ] Unnecessary API calls eliminated
- [ ] Debouncing/throttling on frequent operations
- [ ] Bundle size optimized (code splitting)

**Backend Performance:**
- [ ] Database queries optimized (indexes, select specific fields)
- [ ] N+1 query problems avoided
- [ ] Pagination for large datasets
- [ ] Response compression enabled
- [ ] Caching strategy (Redis, in-memory)

**API Efficiency:**
- [ ] Bulk operations instead of loops
- [ ] Proper HTTP caching headers
- [ ] Conditional requests (ETag, If-Modified-Since)
- [ ] Response size minimized (no over-fetching)

**Scalability:**
- [ ] Stateless server design (sessions in DB/Redis)
- [ ] Database connection pooling
- [ ] Graceful degradation under load
- [ ] Horizontal scaling considerations
- [ ] Background jobs for long operations

**Output:** Performance section with benchmarks and optimization suggestions

---

### Step 6: Code Quality & Maintainability Review

**Readability:**
- [ ] Consistent code style (ESLint, Prettier)
- [ ] Clear, descriptive variable names
- [ ] Functions are small and focused
- [ ] Complex logic explained with comments
- [ ] No magic numbers (use constants)

**Code Organization:**
- [ ] Logical file/folder structure
- [ ] Related code grouped together
- [ ] No god classes or monster files
- [ ] Consistent import order
- [ ] Clear module boundaries

**DRY Principle:**
- [ ] No duplicated code (extract to utilities)
- [ ] Shared logic in common modules
- [ ] Reusable components/functions
- [ ] Configuration centralized

**Documentation:**
- [ ] Complex functions documented (JSDoc)
- [ ] API endpoints documented (Swagger/OpenAPI)
- [ ] README files up to date
- [ ] Architecture decisions recorded (ADRs)
- [ ] Setup instructions clear

**Output:** Code quality section with refactoring opportunities

---

### Step 7: Testing Review

**Unit Tests:**
- [ ] Critical business logic covered
- [ ] Edge cases tested
- [ ] Services have test coverage
- [ ] Utilities and helpers tested
- [ ] Mock external dependencies

**Frontend Tests:**
- [ ] Component rendering tests (Vitest)
- [ ] User interaction tests
- [ ] Store/hook tests
- [ ] Snapshot tests for UI stability

**Backend Tests:**
- [ ] Controller tests (mocked services)
- [ ] Service tests (mocked database)
- [ ] Integration tests (real database)
- [ ] API endpoint tests

**Test Quality:**
- [ ] Tests are isolated (no shared state)
- [ ] Clear test descriptions
- [ ] Proper setup/teardown
- [ ] Mocks are realistic
- [ ] Test data is meaningful

**Coverage:**
- [ ] Critical paths have >80% coverage
- [ ] New features include tests
- [ ] Tests run in CI/CD

**Output:** Testing section with coverage gaps and test suggestions

---

### Step 8: DevOps & Deployment Readiness

**Configuration:**
- [ ] Environment-specific configs (.env files)
- [ ] Config validation on startup
- [ ] Secrets not committed
- [ ] Development/staging/production environments

**Build & Deployment:**
- [ ] Build scripts work consistently
- [ ] Production build optimized
- [ ] Docker/PM2 setup correct
- [ ] Health check endpoints
- [ ] Graceful shutdown handling

**Logging & Monitoring:**
- [ ] Structured logging (JSON format)
- [ ] Log levels used appropriately
- [ ] No sensitive data in logs
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring ready

**CI/CD:**
- [ ] Automated tests on commits
- [ ] Linting in pipeline
- [ ] Build verification
- [ ] Deployment automation
- [ ] Rollback strategy

**Output:** DevOps section with deployment improvements

---

### Step 9: Best Practices & Final Recommendations

**Issue Prioritization:**

**HIGH (Must Fix):**
- Security vulnerabilities
- Data loss risks
- Authentication/authorization flaws
- Critical performance issues
- Breaking changes in production

**MEDIUM (Should Fix):**
- Code smells and anti-patterns
- Missing error handling
- Poor test coverage
- Scalability concerns
- Maintainability issues

**LOW (Nice to Have):**
- Code style inconsistencies
- Documentation gaps
- Performance optimizations
- Refactoring opportunities
- Future enhancements

---

## Output Format

```markdown
# Code Review: [Feature/PR Name]

## Summary
- **Total Issues:** X (High: Y, Medium: Z, Low: W)
- **Overall Quality:** [Excellent/Good/Needs Improvement/Poor]
- **Recommendation:** [Approve/Request Changes/Reject]

## 1. Architecture & Design
### Issues Found
- [HIGH] Tight coupling between CollectionService and RequestExecutor
  - File: `backend/src/services/CollectionService.ts:45`
  - Issue: Service directly instantiates dependencies
  - Fix: Use dependency injection
  ```typescript
  // Bad
  const executor = new RequestExecutor();
  
  // Good
  constructor(private executor: RequestExecutor) {}
  ```

## 2. Frontend Review
### Performance Issues
- [MEDIUM] Unnecessary re-renders in RequestBuilder
  - File: `frontend/src/components/request/RequestBuilder.tsx:120`
  - Issue: Missing memoization for expensive operations
  - Fix: Wrap in useMemo/useCallback

## 3. Backend Review
[... continue for each section ...]

## Action Items
### Critical (Fix Before Merge)
1. [ ] Fix authentication bypass in `/api/requests/execute`
2. [ ] Add input validation to all POST endpoints

### High Priority (Fix This Sprint)
1. [ ] Refactor CollectionService into smaller services
2. [ ] Add error boundaries to main UI sections

### Medium Priority (Plan for Next Sprint)
1. [ ] Implement caching for frequently accessed collections
2. [ ] Add integration tests for collection runner

### Optional Improvements
1. [ ] Extract common UI patterns into design system
2. [ ] Add API documentation with Swagger
```

---

## Project-Specific Checklist

### API Testing Tool Specific
- [ ] Request execution isolated and sandboxed
- [ ] Script execution (pre-request/test) secure
- [ ] Variable resolution works correctly
- [ ] Collection hierarchy maintained (workspace → collection → folder → request)
- [ ] History stored properly (PostgreSQL + MongoDB hybrid)
- [ ] Environment switching doesn't break active requests
- [ ] File uploads validated and stored securely
- [ ] Export/import maintains data integrity

---

## Tips for Effective Reviews

1. **Start Broad, Then Narrow:** Architecture → Module → Function → Line
2. **Balance Criticism with Praise:** Acknowledge good patterns
3. **Provide Context:** Explain *why* something is an issue
4. **Suggest Solutions:** Don't just point out problems
5. **Consider Trade-offs:** Sometimes "good enough" is okay
6. **Be Specific:** Reference exact files and line numbers
7. **Use Code Examples:** Show before/after snippets
8. **Prioritize Ruthlessly:** Not everything needs fixing now

---

## Example Usage

**Prompt:**
```
Review the authentication implementation in backend/src/services/AuthService.ts
```

**Prompt:**
```
Perform a full code review of the Collection Runner feature (both frontend and backend)
```

**Prompt:**
```
Review PR #123 focusing on security and performance
```

**Prompt:**
```
Quick review of RequestExecutor.ts for potential bugs
```
