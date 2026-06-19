import { request } from 'node:http';
import type { Backend } from '../config/types.js';
import { uptime } from 'node:process';

export class MetricsRegistry {
  public totalRequests = 0;
  public activeConnections = 0;
  public startedAt = Date.now();

  private backendMetrics = new Map<
    string,
    {
      requests: number;
      activeConnections: number;
      totalLatency: number;
    }
  >();

  constructor(backends: Backend[]) {
    for (const backend of backends) {
      this.backendMetrics.set(backend.id, {
        requests: 0,
        activeConnections: 0,
        totalLatency: 0,
      });
    }
  }

  recordRequest(backendId: string) {
    this.totalRequests++;

    const backend = this.backendMetrics.get(backendId);

    if (!backend) return;

    backend.requests++;
  }

  connectionOpened(backendId: string) {
    this.activeConnections++;

    const backend = this.backendMetrics.get(backendId);

    if (!backend) return;

    backend.activeConnections++;
  }

  connectionClosed(backendId: string) {
    this.activeConnections--;

    const backend = this.backendMetrics.get(backendId);

    if (!backend) return;

    backend.activeConnections--;
  }
  recordLatency(backendId: string, latency: number) {
    const backend = this.backendMetrics.get(backendId);

    if (!backend) return;

    backend.totalLatency += latency;
  }

  getBackendMetrics(backendId: string) {
    return this.backendMetrics.get(backendId);
  }

  snapshot() {
    return {
      totalRequests: this.totalRequests,
      activeConnections: this.activeConnections,
      uptime: Date.now() - this.startedAt,

      backends: Object.fromEntries(
        [...this.backendMetrics].map(([id, stats]) => [
          id,
          {
            requests: stats.requests,
            activeConnections: stats.activeConnections,
            averageLatency: stats.requests === 0 ? 0 : stats.totalLatency / stats.requests,
          },
        ]),
      ),
    };
  }
}
