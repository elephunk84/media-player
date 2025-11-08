import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Basic API endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Media Player API',
    version: '1.0.0',
    status: 'running',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
  console.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.info(`Database type: ${process.env.DB_TYPE || 'not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
