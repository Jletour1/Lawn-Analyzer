// Configuration utilities for accessing environment variables

export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '',
    project: import.meta.env.VITE_OPENAI_PROJECT || import.meta.env.OPENAI_PROJECT || '',
  },
  
  // Reddit API Configuration
  reddit: {
    clientId: import.meta.env.VITE_REDDIT_CLIENT_ID || import.meta.env.REDDIT_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_REDDIT_CLIENT_SECRET || import.meta.env.REDDIT_CLIENT_SECRET || '',
    userAgent: import.meta.env.VITE_REDDIT_USER_AGENT || import.meta.env.REDDIT_USER_AGENT || 'lawn_analyzer_research_v1.0',
  },
  
  // Database Configuration
  database: {
    path: import.meta.env.VITE_DB_PATH || './datasets/reddit_lawn_data.db',
    url: import.meta.env.VITE_DATABASE_URL || 'sqlite:///datasets/reddit_lawn_data.db',
  },
  
  // Application Configuration
  app: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === '1',
    devMode: import.meta.env.VITE_DEV_MODE === 'true',
    nodeEnv: import.meta.env.NODE_ENV || 'development',
  },
  
  // Server Configuration
  server: {
    port: import.meta.env.VITE_PORT || 5173,
    host: import.meta.env.VITE_HOST || 'localhost',
  }
};

// Validation function to check if required environment variables are set
export const validateConfig = () => {
  const required = [
    'VITE_OPENAI_API_KEY',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
};

// Helper to check if we're in development mode
export const isDevelopment = () => config.app.nodeEnv === 'development';

// Helper to check if we should use mock data
export const useMockData = () => config.app.useMockData;