interface WindowEntry {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private readonly windows = new Map<string, WindowEntry>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  isAllowed(ip: string): boolean {
    const now = Date.now();
    const entry = this.windows.get(ip);

    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.windows.set(ip, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  purgeExpired(): void {
    const now = Date.now();
    for (const [ip, entry] of this.windows) {
      if (now - entry.windowStart >= this.windowMs) {
        this.windows.delete(ip);
      }
    }
  }
}
