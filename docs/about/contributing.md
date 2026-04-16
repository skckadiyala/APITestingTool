# Contributing to Simba

Thank you for considering contributing to Simba API Testing Tool! We welcome contributions from the community.

---

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- 🤝 Be respectful and inclusive
- 💬 Use welcoming and constructive language
- 🎯 Focus on what is best for the community
- 🙏 Show empathy towards other community members
- ❌ No harassment or discriminatory behavior

---

## How Can I Contribute?

### Reporting Bugs

**Before submitting a bug report:**
1. Check the [FAQ](../reference/faq.md) and [Troubleshooting Guide](../reference/troubleshooting.md)
2. Search [existing issues](https://github.com/skckadiyala/APITestingTool/issues) to avoid duplicates
3. Update to the latest version to see if the issue persists

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. Send request with '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
Add screenshots if applicable.

**Environment:**
- OS: [e.g., macOS 14.0, Windows 11]
- Browser: [e.g., Chrome 120, Firefox 121]
- Simba Version: [e.g., 1.0.0]
- Node.js Version: [e.g., 18.17.0]

**Additional context**
Any other relevant information.
```

### Suggesting Features

**Feature Request Template:**
```markdown
**Is your feature request related to a problem?**
A clear description of the problem. Ex. I'm frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Mockups, examples from other tools, etc.
```

### Pull Requests

**Process:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write tests for new functionality
5. Ensure all tests pass
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

---

## Development Setup

### Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later
- **Docker** & Docker Compose
- **Git**
- **PostgreSQL** 14+ (via Docker)
- **MongoDB** 6+ (via Docker)

### Clone Repository

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/APITestingTool.git
cd APITestingTool

# Add upstream remote
git remote add upstream https://github.com/skckadiyala/APITestingTool.git
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start databases (Docker)
cd ..
docker-compose up -d postgres mongodb

# Run migrations
cd backend
npx prisma migrate dev

# Seed database
npm run seed:all

# Start development server
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env
nano .env

# Start development server
npm run dev
```

Frontend runs on: http://localhost:5174

### Run Tests

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

---

## Project Structure

```
APITestingTool/
├── backend/                 # Express.js + TypeScript backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utilities
│   ├── prisma/              # PostgreSQL schema & migrations
│   └── tests/               # Jest tests
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── stores/          # Zustand state management
│   │   ├── services/        # API services
│   │   └── utils/           # Utilities
│   └── tests/               # Vitest tests
└── docs/                    # MkDocs documentation
```

---

## Coding Standards

### TypeScript Guidelines

```typescript
// ✅ DO: Use explicit types
function getUserById(id: string): Promise<User> {
  return userService.findOne(id);
}

// ❌ DON'T: Avoid 'any'
function processData(data: any) {
  // ...
}

// ✅ DO: Use interfaces for objects
interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
}

// ✅ DO: Use async/await instead of callbacks
async function loadUser(id: string) {
  try {
    const user = await userService.find(id);
    return user;
  } catch (error) {
    logger.error('Failed to load user', error);
    throw error;
  }
}
```

### React Guidelines

```typescript
// ✅ DO: Use functional components with hooks
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    loadUser(userId);
  }, [userId]);
  
  return <div>{user?.name}</div>;
};

// ✅ DO: Extract complex logic to custom hooks
const useUserProfile = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // fetch logic
  }, [userId]);
  
  return { user, loading };
};

// ✅ DO: Use Zustand for global state
import { useAuthStore } from '@/stores/authStore';

const { user, login, logout } = useAuthStore();
```

### Database Guidelines

**PostgreSQL (Prisma):**
```typescript
// ✅ DO: Use Prisma for structured relational data
const collection = await prisma.collection.create({
  data: {
    name: 'My Collection',
    workspaceId: workspaceId,
  },
  include: {
    requests: true,
  },
});
```

**MongoDB (Mongoose):**
```typescript
// ✅ DO: Use MongoDB for large document storage
const requestBody = await RequestBody.create({
  requestId: request.id,
  headers: [{ key: 'Content-Type', value: 'application/json' }],
  body: JSON.stringify(largePayload),
  testScript: testScriptCode,
});
```

### Naming Conventions

```typescript
// Components: PascalCase
UserProfile.tsx
RequestBuilder.tsx

// Files/folders: kebab-case
user-service.ts
request-executor.ts

// Variables/functions: camelCase
const userName = 'John';
async function fetchUserData() {}

// Constants: UPPER_SNAKE_CASE
const MAX_REQUEST_SIZE = 1024 * 1024;
const API_BASE_URL = process.env.API_URL;

// Types/Interfaces: PascalCase
interface User {}
type RequestMethod = 'GET' | 'POST';
```

---

## Testing Guidelines

### Backend Tests (Jest)

```typescript
// backend/src/services/user.service.test.ts
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'securepass123',
        name: 'Test User',
      };
      
      const user = await userService.create(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // hashed
    });
    
    it('should throw error for duplicate email', async () => {
      // ... test implementation
    });
  });
});
```

### Frontend Tests (Vitest)

```typescript
// frontend/src/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user name', () => {
    render(<UserProfile userId="123" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(<UserProfile userId="123" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

---

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Code style (formatting, no code change)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks

# Examples
feat(auth): add OAuth2 authentication
fix(request): resolve GraphQL query parsing issue
docs(tutorial): add CI/CD integration guide
test(collection): add Collection Runner tests
refactor(store): migrate to Zustand from Redux
```

**Good Commit Messages:**
```
✅ feat(graphql): add schema introspection support
✅ fix(executor): handle timeout errors correctly
✅ docs(api): update scripting API reference
```

**Bad Commit Messages:**
```
❌ fixed bug
❌ update
❌ WIP
```

---

## Pull Request Guidelines

### Before Submitting

**Checklist:**
- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new functionality
- [ ] Documentation updated (if applicable)
- [ ] No console.log/debugger statements
- [ ] Git commit messages follow convention
- [ ] PR description is clear and complete

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing process.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainer reviews code
3. **Revisions**: Address feedback if needed
4. **Approval**: Maintainer approves PR
5. **Merge**: PR merged to main branch

---

## Documentation Contributions

### Updating Docs

```bash
cd docs

# Install MkDocs
pip install -r docs-requirements.txt

# Preview locally
mkdocs serve

# Edit markdown files
nano docs/getting-started/installation.md

# Build
mkdocs build
```

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Cross-reference related pages
- Test all code examples work

---

## Release Process

**Maintainers Only**

1. Update version in `package.json` (both backend and frontend)
2. Update [CHANGELOG.md](changelog.md)
3. Create release branch: `git checkout -b release/v1.1.0`
4. Run full test suite
5. Tag release: `git tag -a v1.1.0 -m "Release v1.1.0"`
6. Push tag: `git push origin v1.1.0`
7. Create GitHub Release with notes
8. Deploy to production

---

## Questions?

- 💬 **Discussions**: [GitHub Discussions](https://github.com/skckadiyala/APITestingTool/discussions)
- 📧 **Email**: support@cdw.com
- 📚 **Docs**: [Documentation](https://your-docs-url.com)

---

## Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](https://github.com/skckadiyala/APITestingTool/blob/main/CONTRIBUTORS.md)
- Mentioned in release notes
- Appreciated in our community 🎉

Thank you for contributing to Simba! 🦁

---

*Last updated: April 15, 2026*
