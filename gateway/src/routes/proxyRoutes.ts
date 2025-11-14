import proxy from 'express-http-proxy';
import { Express, Request, Response } from 'express';
import logger from '../utils/logger.js';
import { randomUUID } from 'crypto';

interface ProxyConfig {
  proxyReqPathResolver: (req: Request) => string;
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => any;
  userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request, userRes: Response) => Buffer;
  proxyErrorHandler: (err: Error, res: Response) => void;
  timeout: number;
}

const createProxyConfig = (serviceName: string): ProxyConfig => ({
  proxyReqPathResolver: (req: Request) => {
    // Transform /v1/users -> /api/users
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
    const requestId = (srcReq as any).id || randomUUID();
    
    // Add gateway headers
    proxyReqOpts.headers['X-Gateway-Source'] = 'api-gateway';
    proxyReqOpts.headers['X-Request-ID'] = requestId;
    proxyReqOpts.headers['X-Forwarded-For'] = srcReq.ip;
    proxyReqOpts.headers['X-Service-Name'] = serviceName;
    
    // Forward authorization header
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
    { envVar: 'USER_SERVICE_URL', route: '/v1/users', name: 'User Service' },
    { envVar: 'USER_SERVICE_URL', route: '/v1/auth', name: 'Auth Service' },
    { envVar: 'PRODUCT_SERVICE_URL', route: '/v1/products', name: 'Product Service' },
    { envVar: 'ORDER_SERVICE_URL', route: '/v1/orders', name: 'Order Service' },
    { envVar: 'PAYMENT_SERVICE_URL', route: '/v1/payments', name: 'Payment Service' },
    { envVar: 'NOTIFICATION_SERVICE_URL', route: '/v1/notifications', name: 'Notification Service' }
  ];
  
  services.forEach(({ envVar, route, name }) => {
    const serviceUrl = process.env[envVar];
    
    if (!serviceUrl) {
      logger.warn(`${envVar} not configured, skipping ${name} proxy setup`);
      return;
    }
    
    app.use(route, proxy(serviceUrl, createProxyConfig(name)));
    logger.info(`✓ Proxy configured: ${route} → ${serviceUrl}`);
  });
};
