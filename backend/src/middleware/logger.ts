import { Request, Response, NextFunction } from 'express';

// Simple request logger middleware
export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Skip logging for terminal polling and common endpoints to reduce noise
  const skipPaths = [
    '/api/terminal/jobs/',
    '/jobs/',
    '/health',
  ];
  
  const shouldSkip = skipPaths.some(path => req.path.includes(path));
  
  if (!shouldSkip) {
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
      );
    });
  }

  next();
}

// Request ID middleware for tracking
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = Math.random().toString(36).substring(7);
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
}
