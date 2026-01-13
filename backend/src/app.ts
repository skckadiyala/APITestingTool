import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import database connections
import { connectMongoDB } from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import requestsRoutes from './routes/requests.routes';
import collectionsRoutes from './routes/collections.routes';
import environmentsRoutes from './routes/environments.routes';
import dataFileRoutes from './routes/dataFile.routes';

const app: Application = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Security middleware
app.use(helmet());

// CORS configuration
const getAllowedOrigins = (): string[] => {
  const frontendUrl = process.env.FRONTEND_URL || `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || '5173'}`;
  const corsOrigin = process.env.CORS_ORIGIN;
  
  const defaultOrigins = [
    frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  
  // Add CORS_ORIGIN if it exists and is different
  if (corsOrigin && !defaultOrigins.includes(corsOrigin)) {
    defaultOrigins.push(corsOrigin);
  }
  
  // Add any additional origins from ALLOWED_ORIGINS
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()).filter(o => o) || [];
  return [...defaultOrigins, ...envOrigins];
};

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
//}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
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
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/workspaces`, workspaceRoutes);
app.use(`${API_PREFIX}/requests`, requestsRoutes);
app.use(`${API_PREFIX}/data-files`, dataFileRoutes);

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

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    app.listen(PORT, () => {
      const host = process.env.BACKEND_HOST || 'localhost';
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
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
