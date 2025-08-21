const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lawn Diagnostic API Server',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication - replace with real auth logic
  if (email && password) {
    res.json({
      success: true,
      user: { id: 1, email, name: 'Test User' },
      token: 'mock-jwt-token'
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  // Mock registration - replace with real registration logic
  if (email && password && name) {
    res.json({
      success: true,
      user: { id: 1, email, name },
      token: 'mock-jwt-token'
    });
  } else {
    res.status(400).json({ success: false, message: 'Missing required fields' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});