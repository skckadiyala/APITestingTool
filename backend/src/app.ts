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

// Import routes (will be created later)
// import authRoutes from './routes/authRoutes';
import requestsRoutes from './routes/requests.routes';
import collectionsRoutes from './routes/collections.routes';
import environmentsRoutes from './routes/environments.routes';

const app: Application = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Security middleware
app.use(helmet());

// CORS configuration
const getAllowedOrigins = (): string[] => {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174'];
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  return [...defaultOrigins, ...envOrigins];
};

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

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

// API Routes (will be uncommented as routes are created)
// app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/requests`, requestsRoutes);
app.use(`${API_PREFIX}/collections`, collectionsRoutes);
app.use(`${API_PREFIX}/environments`, environmentsRoutes);

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
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
