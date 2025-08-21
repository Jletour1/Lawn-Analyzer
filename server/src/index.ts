import express from 'express';
import cors from 'cors';
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

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : ['http://localhost:5173', 'https://localhost:5173'],
  credentials: true
}));

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Lawn Analyzer API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      api: '/api/*'
    }
  });
});

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