export interface BackendMetrics {
  requests: number;
  activeConnections: number;
  totalLatency: number;
}

export interface GlobalMetrics {
  totalRequests: number;
  activeConnections: number;
  startedAt: number;
}
