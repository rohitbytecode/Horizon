import type { Backend } from '../config/types.js';

export class MetricsRegistry {
  public totalRequests = 0;
  public activeConnections = 0;
}
