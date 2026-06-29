export interface Backend {
  id: string;
  host: string;
  port: number;
  healthy: boolean;
}

export interface HorizonConfig {
  port: number;
  backends: Backend[];
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface Backend {
  id: string;
  host: string;
  port: number;
  healthy: boolean;
}

export interface HorizonConfig {
  port: number;
  backends: Backend[];
  rateLimit?: RateLimitConfig;
}
