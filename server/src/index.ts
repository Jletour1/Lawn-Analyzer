import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import routes
// import authRoutes from './routes/auth';
// import submissionRoutes from './routes/submissions';
// import adminRoutes from './routes/admin';
// import rootCauseRoutes from './routes/rootCauses';
// import treatmentScheduleRoutes from './routes/treatmentSchedules';
// import uploadRoutes from './routes/upload';

// Import middleware
// import { errorHandler } from './middleware/errorHandler';
// import { authenticateToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : ['http://localhost:5173', 'https://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiting for analysis endpoints
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 analysis requests per hour
  message: 'Analysis rate limit exceeded. Please try again later.'
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Logging
app.use(morgan('combined'));

// Temporary basic auth endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple hardcoded admin check for testing
  if ((email === 'admin@lawnanalyzer.com' || email === 'Jletz14') && password === 'Fanduel01') {
    res.json({
      success: true,
      data: {
        token: 'test-token-123',
        user: {
          id: '1',
          email: 'admin@lawnanalyzer.com',
          name: 'Admin',
          role: 'admin',
          created_at: new Date().toISOString()
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Temporary me endpoint for testing
app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      email: 'admin@lawnanalyzer.com',
      name: 'Admin',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  });
});

// API routes (commented out until dependencies are resolved)
// app.use('/api/auth', authRoutes);
// app.use('/api/submissions', submissionRoutes);
// app.use('/api/admin', authenticateToken, adminRoutes);
// app.use('/api/root-causes', rootCauseRoutes);
// app.use('/api/treatment-schedules', treatmentScheduleRoutes);
// app.use('/api/upload', authenticateToken, uploadRoutes);

// Apply analysis rate limiting to specific endpoints (commented out)
// app.use('/api/submissions', analysisLimiter);
// app.use('/api/admin/analysis', analysisLimiter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (commented out)
// app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
  console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});