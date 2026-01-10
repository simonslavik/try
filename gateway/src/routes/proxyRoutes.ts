import proxy from 'express-http-proxy';
import { Express, Request, Response } from 'express';
import logger from '../utils/logger.js';
import { randomUUID } from 'crypto';
import authHandler from '../middleware/authHandler.js';

interface ProxyConfig {
  proxyReqPathResolver: (req: Request) => string;
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => any;
  userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request, userRes: Response) => Buffer;
  proxyErrorHandler: (err: Error, res: Response) => void;
  timeout: number;
}

const createProxyConfig = (serviceName: string, pathTransform?: (path: string) => string): ProxyConfig => ({
  proxyReqPathResolver: (req: Request) => {
    // Use custom path transform if provided, otherwise default transformation
    if (pathTransform) {
      return pathTransform(req.originalUrl);
    }
    // Default: Transform /v1/users -> /api/users
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
    const requestId = (srcReq as any).id || randomUUID();
    
    // Add gateway headers
    proxyReqOpts.headers['X-Gateway-Source'] = 'api-gateway';
    proxyReqOpts.headers['X-Request-ID'] = requestId;
    proxyReqOpts.headers['X-Forwarded-For'] = srcReq.ip;
    proxyReqOpts.headers['X-Service-Name'] = serviceName;
    
    // Forward authorization header (services will verify JWT)
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }
    
    logger.info(`[${requestId}] Proxying ${srcReq.method} ${srcReq.url} to ${serviceName}`);
    return proxyReqOpts;
  },
  
  userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request) => {
    const requestId = (userReq as any).id || 'unknown';
    logger.info(`[${requestId}] ${serviceName} responded with ${proxyRes.statusCode} for ${userReq.url}`);
    // Don't log response body - may contain sensitive data
    return proxyResData;
  },
  
  proxyErrorHandler: (err: Error, res: Response) => {
    logger.error(`Proxy error for ${serviceName}: ${err.message}`);
    res.status(503).json({
      success: false,
      message: `${serviceName} is currently unavailable`,
      error: process.env.NODE_ENV === 'production' ? 'Service unavailable' : err.message
    });
  },
  
  timeout: 10000 // 10 seconds
});

export const setupProxyRoutes = (app: Express): void => {
  const services = [
    { envVar: 'USER_SERVICE_URL', route: '/v1/profile', name: 'Profile Service', requireAuth: false },
    { envVar: 'USER_SERVICE_URL', route: '/v1/users', name: 'User Service', requireAuth: true },
    { envVar: 'USER_SERVICE_URL', route: '/v1/auth', name: 'Auth Service', requireAuth: false },
    { 
      envVar: 'COLLAB_EDITOR_URL', 
      route: '/v1/editor', 
      name: 'Collab Editor Service', 
      requireAuth: false,
      pathTransform: (path: string) => path.replace(/^\/v1\/editor/, '') // /v1/editor/health -> /health
    },
  ];
  
  services.forEach(({ envVar, route, name, requireAuth, pathTransform }: any) => {
    const serviceUrl = process.env[envVar];
    
    if (!serviceUrl) {
      logger.warn(`${envVar} not configured, skipping ${name} proxy setup`);
      return;
    }
    
    // Apply auth middleware only to protected routes
    if (requireAuth) {
      app.use(route, authHandler, proxy(serviceUrl, createProxyConfig(name, pathTransform)));
      logger.info(`✓ Proxy configured (protected): ${route} → ${serviceUrl}`);
    } else {
      app.use(route, proxy(serviceUrl, createProxyConfig(name, pathTransform)));
      logger.info(`✓ Proxy configured (public): ${route} → ${serviceUrl}`);
    }
  });
};
