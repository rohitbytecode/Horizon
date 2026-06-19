import http from 'http';
import type { Backend } from '../config/types.js';
import { Logger } from '../logger/Logger.js';
import { hostname } from 'os';
import path from 'path';

export class HealthChecker {
  constructor(private backends: Backend[]) {}

  start(interval = 5000) {
    setInterval(() => {
      for (const backend of this.backends) {
        const req = http.request(
          {
            hostname: backend.host,
            port: backend.port,
            path: '/health',
            method: 'GET',
            timeout: 2000,
          },
          (res) => {
            const healthy = res.statusCode === 200;

            if (backend.healthy !== healthy) {
              Logger.info(`${backend.id} -> ${healthy ? 'UP' : 'DOWN'}`);
            }
            backend.healthy = healthy;
          },
        );

        req.on('error', () => {
          if (backend.healthy) {
            Logger.error(`${backend.id} -> DOWN`);
          }
          backend.healthy = false;
        });

        req.on('timeout', () => {
          req.destroy();
          backend.healthy = false;
        });

        req.end();
      }
    }, interval);
  }
}
