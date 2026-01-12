# Design Guidelines & Architecture

This document provides the design principles, architecture patterns, and UI/UX guidelines for building the API Testing Tool.

---

## 🎨 Design Principles

### 1. Simplicity First
- Clean, uncluttered interface
- Progressive disclosure (hide complexity until needed)
- Sensible defaults
- Clear visual hierarchy

### 2. Performance
- Fast load times (< 3s initial load)
- Responsive interactions (< 100ms feedback)
- Efficient rendering for large collections
- Optimistic UI updates

### 3. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast mode
- Focus indicators

### 4. Consistency
- Consistent naming conventions
- Uniform component behavior
- Predictable patterns
- Design system adherence

---

## 🏛️ System Architecture

### Frontend Architecture (React)

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Dropdown/
│   │   └── KeyValueEditor/
│   ├── layout/              # Layout components
│   │   ├── TopNavbar/
│   │   ├── Sidebar/
│   │   ├── MainContent/
│   │   └── BottomPanel/
│   ├── request/             # Request-related components
│   │   ├── RequestBuilder/
│   │   ├── URLBar/
│   │   ├── RequestTabs/
│   │   ├── BodyEditor/
│   │   └── AuthConfig/
│   ├── response/            # Response-related components
│   │   ├── ResponseViewer/
│   │   ├── ResponseTabs/
│   │   ├── StatusBar/
│   │   └── TestResults/
│   ├── collections/         # Collection management
│   │   ├── CollectionTree/
│   │   ├── CollectionRunner/
│   │   └── ImportExport/
│   └── environments/        # Environment management
│       ├── EnvironmentSelector/
│       └── EnvironmentEditor/
├── hooks/                   # Custom React hooks
│   ├── useRequest.ts
│   ├── useCollection.ts
│   ├── useEnvironment.ts
│   ├── useAuth.ts
│   └── useVariableResolver.ts
├── store/                   # State management (Zustand)
│   ├── authStore.ts
│   ├── requestStore.ts
│   ├── collectionStore.ts
│   ├── environmentStore.ts
│   └── uiStore.ts
├── services/                # API service layer
│   ├── api.ts              # Axios instance with interceptors
│   ├── authService.ts
│   ├── requestService.ts
│   ├── collectionService.ts
│   └── environmentService.ts
├── utils/                   # Utility functions
│   ├── variableResolver.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── httpClient.ts
├── types/                   # TypeScript type definitions
│   ├── request.types.ts
│   ├── collection.types.ts
│   ├── environment.types.ts
│   └── api.types.ts
├── constants/               # Constants and configurations
│   ├── httpMethods.ts
│   ├── authTypes.ts
│   └── contentTypes.ts
└── App.tsx
```

### Backend Architecture (Express.js)

```
backend/
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts
│   │   ├── requestController.ts
│   │   ├── collectionController.ts
│   │   └── environmentController.ts
│   ├── services/            # Business logic layer
│   │   ├── authService.ts
│   │   ├── requestService.ts
│   │   ├── collectionService.ts
│   │   ├── environmentService.ts
│   │   ├── variableService.ts
│   │   └── scriptExecutor.ts
│   ├── repositories/        # Data access layer
│   │   ├── userRepository.ts
│   │   ├── requestRepository.ts
│   │   ├── collectionRepository.ts
│   │   └── environmentRepository.ts
│   ├── middleware/          # Express middleware
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── rateLimiter.ts
│   ├── models/              # Database models
│   │   ├── prisma/         # Prisma schema
│   │   └── mongoose/       # Mongoose models
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts
│   │   ├── requestRoutes.ts
│   │   ├── collectionRoutes.ts
│   │   └── environmentRoutes.ts
│   ├── utils/               # Utility functions
│   │   ├── httpClient.ts
│   │   ├── encryption.ts
│   │   ├── validators.ts
│   │   └── logger.ts
│   ├── types/               # TypeScript types
│   ├── config/              # Configuration
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── app.ts
│   └── app.ts              # Express app setup
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json
```

---

## 🎭 Design Patterns

### Frontend Patterns

#### 1. Container/Presentational Pattern
```typescript
// Container (logic)
const RequestBuilderContainer: React.FC = () => {
  const { request, updateRequest } = useRequestStore();
  const { executeRequest, loading } = useRequest();

  const handleSend = async () => {
    await executeRequest(request);
  };

  return (
    <RequestBuilderView
      request={request}
      onUpdateRequest={updateRequest}
      onSend={handleSend}
      loading={loading}
    />
  );
};

// Presentational (UI)
const RequestBuilderView: React.FC<Props> = ({
  request,
  onUpdateRequest,
  onSend,
  loading
}) => {
  return (
    <div>
      <URLBar url={request.url} onChange={...} />
      <Button onClick={onSend} loading={loading}>Send</Button>
    </div>
  );
};
```

#### 2. Custom Hooks Pattern
```typescript
// useRequest hook
export const useRequest = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const executeRequest = async (request: Request) => {
    setLoading(true);
    try {
      const res = await requestService.execute(request);
      setResponse(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { executeRequest, loading, response, error };
};
```

#### 3. Compound Components Pattern
```typescript
// RequestTabs compound component
export const RequestTabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('params');
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

RequestTabs.List = TabsList;
RequestTabs.Tab = Tab;
RequestTabs.Panel = TabPanel;

// Usage
<RequestTabs>
  <RequestTabs.List>
    <RequestTabs.Tab id="params">Params</RequestTabs.Tab>
    <RequestTabs.Tab id="headers">Headers</RequestTabs.Tab>
  </RequestTabs.List>
  <RequestTabs.Panel id="params">...</RequestTabs.Panel>
  <RequestTabs.Panel id="headers">...</RequestTabs.Panel>
</RequestTabs>
```

### Backend Patterns

#### 1. Repository Pattern
```typescript
// Repository interface
interface IRequestRepository {
  findById(id: string): Promise<Request | null>;
  findByCollectionId(collectionId: string): Promise<Request[]>;
  create(request: CreateRequestDto): Promise<Request>;
  update(id: string, request: UpdateRequestDto): Promise<Request>;
  delete(id: string): Promise<void>;
}

// Implementation
class RequestRepository implements IRequestRepository {
  async findById(id: string): Promise<Request | null> {
    return await prisma.request.findUnique({ where: { id } });
  }
  // ... other methods
}
```

#### 2. Service Layer Pattern
```typescript
// Service with business logic
class RequestService {
  constructor(
    private requestRepository: IRequestRepository,
    private variableService: VariableService,
    private scriptExecutor: ScriptExecutor
  ) {}

  async executeRequest(
    requestId: string,
    environmentId: string | null
  ): Promise<RequestResponse> {
    // 1. Get request
    const request = await this.requestRepository.findById(requestId);
    
    // 2. Resolve variables
    const resolvedRequest = await this.variableService.resolve(
      request,
      environmentId
    );
    
    // 3. Execute pre-request script
    if (request.preRequestScript) {
      await this.scriptExecutor.execute(request.preRequestScript, context);
    }
    
    // 4. Make HTTP request
    const response = await this.makeHttpRequest(resolvedRequest);
    
    // 5. Execute test script
    if (request.testScript) {
      const testResults = await this.scriptExecutor.execute(
        request.testScript,
        { request, response }
      );
    }
    
    // 6. Save to history
    await this.saveToHistory(request, response);
    
    return response;
  }
}
```

#### 3. Middleware Chain Pattern
```typescript
// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    req.user = await userRepository.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Usage
router.get('/collections', authMiddleware, collectionController.getAll);
```

---

## 🎨 UI/UX Guidelines

### Color Scheme

```css
/* Light Theme */
--primary: #3B82F6;      /* Blue */
--secondary: #8B5CF6;    /* Purple */
--success: #10B981;      /* Green */
--warning: #F59E0B;      /* Amber */
--error: #EF4444;        /* Red */
--background: #FFFFFF;
--surface: #F9FAFB;
--text-primary: #111827;
--text-secondary: #6B7280;
--border: #E5E7EB;

/* Dark Theme */
--primary: #60A5FA;
--secondary: #A78BFA;
--success: #34D399;
--warning: #FBBF24;
--error: #F87171;
--background: #111827;
--surface: #1F2937;
--text-primary: #F9FAFB;
--text-secondary: #9CA3AF;
--border: #374151;
```

### Typography

```css
/* Font Family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
/* Spacing Scale (4px base) */
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

### Component Examples

#### Button Component
```tsx
<Button variant="primary" size="md" loading={false}>
  Send Request
</Button>

<Button variant="secondary" size="sm" icon={<PlusIcon />}>
  Add
</Button>

<Button variant="outline" size="lg" disabled>
  Disabled
</Button>

// Variants: primary, secondary, outline, ghost, danger
// Sizes: xs, sm, md, lg, xl
```

#### Input Component
```tsx
<Input
  label="Request Name"
  placeholder="Enter request name"
  value={name}
  onChange={setName}
  error="Name is required"
  leftIcon={<SearchIcon />}
  rightIcon={<InfoIcon />}
/>
```

#### Status Badges
```tsx
<StatusBadge status={200} /> // Green: 2xx
<StatusBadge status={301} /> // Yellow: 3xx
<StatusBadge status={404} /> // Red: 4xx
<StatusBadge status={500} /> // Red: 5xx
```

#### Method Badges
```tsx
<MethodBadge method="GET" />    // Blue
<MethodBadge method="POST" />   // Green
<MethodBadge method="PUT" />    // Orange
<MethodBadge method="DELETE" /> // Red
<MethodBadge method="PATCH" />  // Purple
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* 2X large devices */
```

### Layout Adjustments

**Desktop (> 1024px):**
- Three-column layout: Sidebar | Main | Response
- Full feature visibility
- Side-by-side request/response

**Tablet (768px - 1024px):**
- Two-column layout: Sidebar | Main
- Collapsible sidebar
- Stacked request/response

**Mobile (< 768px):**
- Single column layout
- Bottom sheet for sidebar
- Tabbed navigation
- Simplified UI

---

## 🎯 Component Library

### Core Components to Build

1. **Button**: Primary, secondary, outline, ghost variants
2. **Input**: Text, number, email, password, search
3. **Textarea**: Multi-line text input
4. **Select**: Dropdown with search
5. **Checkbox**: Single and group
6. **Radio**: Radio button group
7. **Switch**: Toggle switch
8. **Modal**: Dialog with backdrop
9. **Drawer**: Side panel
10. **Tooltip**: Hover information
11. **Dropdown Menu**: Context menu
12. **Toast/Notification**: Success, error, warning, info
13. **Tabs**: Horizontal and vertical
14. **Badge**: Status indicators
15. **Avatar**: User profile image
16. **Spinner**: Loading indicator
17. **Progress Bar**: Task progress
18. **Accordion**: Collapsible sections
19. **Tree View**: Hierarchical list
20. **Table**: Data table with sorting/filtering
21. **Pagination**: Page navigation
22. **Breadcrumb**: Navigation path
23. **Card**: Content container
24. **Divider**: Section separator
25. **Empty State**: No data placeholder

---

## 🔐 Security Design

### 1. Authentication Flow
```
User Login → Server Validates → Generate JWT → Return Token
↓
Store in httpOnly Cookie + localStorage (for refresh)
↓
Include in Authorization Header for API requests
↓
Token expires → Use refresh token → Get new JWT
↓
Refresh token expires → Require login
```

### 2. Data Protection
- Encrypt sensitive environment variables at rest
- Mask secrets in UI (show only last 4 characters)
- Never log sensitive data
- Use HTTPS for all communications
- Implement CORS properly

### 3. Input Validation
- Client-side validation (UX)
- Server-side validation (security)
- Sanitize HTML input
- Validate file uploads (type, size)
- Rate limiting on sensitive endpoints

---

## 🧪 Testing Strategy

### Unit Tests (70% coverage target)
- Test individual functions and components
- Mock external dependencies
- Use Jest for testing framework

### Integration Tests (20% coverage target)
- Test feature workflows
- Test API endpoints with database
- Use Supertest for API testing

### E2E Tests (10% coverage target)
- Test critical user journeys
- Use Playwright or Cypress
- Run in CI/CD pipeline

### Test Pyramid
```
       /\
      /E2E\         Few, slow, expensive
     /------\
    /  INT   \      More, faster
   /----------\
  /    UNIT    \    Many, fast, cheap
 /--------------\
```

---

## 📊 Monitoring & Analytics

### Performance Metrics
- Page load time (< 3s)
- Time to interactive (< 3.5s)
- First contentful paint (< 1.5s)
- API response time (< 200ms p95)
- Error rate (< 1%)

### User Analytics
- Feature usage tracking
- User journey mapping
- A/B testing capabilities
- Funnel analysis

### Error Tracking
- Frontend: Sentry or LogRocket
- Backend: Application logs + Sentry
- Database: Slow query logs

---

## 🚀 Deployment Architecture

```
                    ┌─────────────┐
                    │   CDN       │
                    │ (CloudFlare)│
                    └──────┬──────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
   ┌────▼─────┐                         ┌─────▼────┐
   │ Frontend │                         │ Backend  │
   │ (Vercel) │                         │  (AWS)   │
   └──────────┘                         └─────┬────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                    ┌────▼─────┐         ┌───▼────┐          ┌────▼────┐
                    │PostgreSQL│         │ MongoDB│          │  Redis  │
                    │   (RDS)  │         │(Atlas) │          │ (Cache) │
                    └──────────┘         └────────┘          └─────────┘
```

---

## 📖 Documentation Standards

### Code Documentation
```typescript
/**
 * Executes an HTTP request with the provided configuration
 * @param request - The request configuration object
 * @param environmentId - Optional environment ID for variable resolution
 * @returns Promise resolving to the response data
 * @throws {RequestExecutionError} If the request fails
 * @example
 * ```typescript
 * const response = await executeRequest({
 *   method: 'GET',
 *   url: 'https://api.example.com/users'
 * });
 * ```
 */
async function executeRequest(
  request: RequestConfig,
  environmentId?: string
): Promise<RequestResponse> {
  // Implementation
}
```

### API Documentation
- Use OpenAPI/Swagger spec
- Include request/response examples
- Document error codes
- Provide authentication details

### User Documentation
- Getting started guide
- Feature tutorials
- Video demonstrations
- FAQ section
- Troubleshooting guide

---

## ✅ Definition of Done

A feature is considered complete when:
- [ ] Code is written and follows conventions
- [ ] Unit tests are written and passing (> 80% coverage)
- [ ] Integration tests are written (if applicable)
- [ ] Code is reviewed and approved
- [ ] Documentation is updated
- [ ] No critical bugs or security issues
- [ ] Accessibility requirements met
- [ ] Performance metrics met
- [ ] Works across browsers (Chrome, Firefox, Safari, Edge)
- [ ] Responsive design tested
- [ ] Deployed to staging and tested
- [ ] Product owner approval

---

## 🎓 Best Practices

### Code Quality
- Follow SOLID principles
- Write self-documenting code
- Keep functions small and focused
- Avoid deep nesting (max 3 levels)
- Use meaningful variable names
- Add comments for complex logic only

### Git Workflow
- Feature branch workflow
- Descriptive commit messages
- Squash commits before merge
- Tag releases with semantic versioning

### Performance
- Lazy load heavy components
- Optimize images
- Minimize bundle size
- Use CDN for static assets
- Implement caching strategies

### Security
- Never commit secrets
- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Keep dependencies updated

---

This design document should serve as the foundation for building a consistent, performant, and user-friendly API testing tool. Refer back to it throughout the development process to ensure alignment with architectural decisions and design principles.
