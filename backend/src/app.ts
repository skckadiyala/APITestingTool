import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import configuration
import { APP_CONFIG } from './config/app.config';

// Import database connections
import { connectMongoDB } from './config/database';

// Import custom errors
import { AppError } from './utils/errors';

// Import routes
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import requestsRoutes from './routes/requests.routes';
import collectionsRoutes from './routes/collections.routes';
import environmentsRoutes from './routes/environments.routes';
import dataFileRoutes from './routes/dataFile.routes';
import workspaceMembersRoutes from './routes/workspaceMembers.routes';
import graphqlRoutes from './routes/graphql.routes';

const app: Application = express();

// CORS configuration
const getAllowedOrigins = (): string[] => {
  const defaultOrigins = [
    APP_CONFIG.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  // Add CORS_ORIGIN if it exists and is different
  if (APP_CONFIG.CORS_ORIGIN && !defaultOrigins.includes(APP_CONFIG.CORS_ORIGIN)) {
    defaultOrigins.push(APP_CONFIG.CORS_ORIGIN);
  }

  // Add any additional origins from ALLOWED_ORIGINS
  return [...defaultOrigins, ...APP_CONFIG.ALLOWED_ORIGINS];
};

// Security middleware
app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Case-insensitive origin matching
    const isAllowed = allowedOrigins.some(allowedOrigin =>
      allowedOrigin.toLowerCase() === origin.toLowerCase()
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: APP_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: APP_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: APP_CONFIG.RATE_LIMIT_MESSAGE,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: APP_CONFIG.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: APP_CONFIG.MAX_REQUEST_SIZE }));

// Logging middleware
if (APP_CONFIG.IS_DEVELOPMENT) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API Testing Tool Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const API_PREFIX = APP_CONFIG.API_PREFIX;
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}`, workspaceMembersRoutes);
app.use(`${API_PREFIX}/workspaces`, workspaceRoutes);
app.use(`${API_PREFIX}/requests`, requestsRoutes);
app.use(`${API_PREFIX}/data-files`, dataFileRoutes);
app.use(`${API_PREFIX}/graphql`, graphqlRoutes);

// Legacy routes (backward compatibility) - keeping these for now
app.use(`${API_PREFIX}/collections`, collectionsRoutes);
app.use(`${API_PREFIX}/environments`, environmentsRoutes);

// Workspace-scoped routes - these are now handled by the workspace routes
// The workspace router will mount collections and environments at /:id/collections and /:id/environments

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Global error handler - standardized error handling
app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  // Log error for debugging
  console.error('Error:', err);

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    status: 'error',
    message: APP_CONFIG.IS_DEVELOPMENT ? err.message : 'Internal server error',
    ...(APP_CONFIG.IS_DEVELOPMENT && { stack: err.stack }),
  });
});

// Start server
const PORT = APP_CONFIG.PORT;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    app.listen(PORT, () => {
      const host = process.env.BACKEND_HOST || 'localhost';
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${APP_CONFIG.NODE_ENV}`);
      console.log(`🔗 Health check: http://${host}:${PORT}/health`);
      console.log(`🔗 API Base URL: http://${host}:${PORT}${API_PREFIX}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
