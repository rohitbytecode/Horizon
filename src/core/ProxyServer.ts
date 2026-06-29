import http from 'http';
import { performance } from 'node:perf_hooks';
import type { HorizonConfig } from '../config/types.js';
import { LoadBalancer } from './LoadBalancer.js';
import { Logger } from '../logger/Logger.js';
import { HealthChecker } from '../health/HealthChecker.js';
import { MetricsRegistry } from '../metrics/MetricsRegistry.js';
import { RateLimiter } from './RateLimiter.js';

const RATE_LIMIT_DEFAULTS = { maxRequests: 100, windowMs: 60_000 };

export class ProxyServer {
  private balancer: LoadBalancer;
  private healthChecker: HealthChecker;
  private metrics: MetricsRegistry;
  private rateLimiter: RateLimiter;

  constructor(private config: HorizonConfig) {
    this.balancer = new LoadBalancer(config.backends);
    this.healthChecker = new HealthChecker(config.backends);
    this.metrics = new MetricsRegistry(config.backends);

    const rl = config.rateLimit ?? RATE_LIMIT_DEFAULTS;
    this.rateLimiter = new RateLimiter(rl.maxRequests, rl.windowMs);
  }

  start() {
    const server = http.createServer((clientReq, clientRes) => {
      if (clientReq.url === '/metrics') {
        clientRes.writeHead(200, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify(this.metrics.snapshot(), null, 2));
        return;
      }

      // Rate limit
      const ip =
        (clientReq.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
        clientReq.socket.remoteAddress ??
        'unknown';

      if (!this.rateLimiter.isAllowed(ip)) {
        Logger.info(`RATE LIMITED ${ip}`);
        clientRes.writeHead(429, {
          'Content-type': 'text/plain',
          'Retry-After': String(Math.ceil((this.config.rateLimit?.windowMs ?? 60_000) / 1000)),
        });
        clientRes.end('Too Many Requests');
        return;
      }

      let backend;
      try {
        backend = this.balancer.next();
      } catch {
        clientRes.statusCode = 503;
        clientRes.end('No healthy backends available');
        return;
      }

      Logger.info(`${clientReq.method} ${clientReq.url} -> ${backend.port}`);

      const start = performance.now();
      this.metrics.recordRequest(backend.id);
      this.metrics.connectionOpened(backend.id);

      const proxyReq = http.request(
        {
          hostname: backend.host,
          port: backend.port,
          path: clientReq.url,
          method: clientReq.method,
          headers: clientReq.headers,
        },
        (proxyRes) => {
          clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(clientRes);

          proxyRes.on('end', () => {
            this.metrics.recordLatency(backend.id, performance.now() - start);
            this.metrics.connectionClosed(backend.id);
          });
        },
      );

      clientReq.pipe(proxyReq);

      proxyReq.on('error', (err) => {
        Logger.error(err.message);
        this.metrics.connectionClosed(backend.id);
        clientRes.statusCode = 502;
        clientRes.end('Bad gateway');
      });
    });

    this.healthChecker.start();
    //Every 5 min
    setInterval(() => this.rateLimiter.purgeExpired(), 5 * 60_000);

    server.listen(this.config.port, () => {
      Logger.info(`Horizon listening on ${this.config.port}`);
    });
  }
}
