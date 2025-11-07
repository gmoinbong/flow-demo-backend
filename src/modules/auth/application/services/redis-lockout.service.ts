/**
 * Redis lockout service - brute-force protection
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    options?: { EX?: number },
  ): Promise<string | null>;
  del(key: string): Promise<number>;
}

export interface LockoutConfig {
  maxAttempts: number;
  lockoutDurationMinutes: number;
}

export interface LockoutData {
  attempts: number;
  lockedUntil: string; // ISO timestamp
}

/**
 * Redis lockout service for brute-force protection
 */
export class RedisLockoutService {
  private readonly lockoutNamespace = 'auth:lockout';

  constructor(
    private readonly redis: RedisClient,
    private readonly config: LockoutConfig,
  ) {}

  /**
   * Get lockout key for email
   */
  private getLockoutKey(email: string): string {
    return `${this.lockoutNamespace}:${email}`;
  }

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(email: string): Promise<void> {
    const key = this.getLockoutKey(email);
    const data = await this.getLockoutData(email);

    if (data && new Date(data.lockedUntil) > new Date()) {
      // Already locked
      return;
    }

    const attempts = (data?.attempts || 0) + 1;
    const lockedUntil = new Date();
    lockedUntil.setMinutes(
      lockedUntil.getMinutes() + this.config.lockoutDurationMinutes,
    );

    const lockoutData: LockoutData = {
      attempts,
      lockedUntil: lockedUntil.toISOString(),
    };

    await this.redis.set(key, JSON.stringify(lockoutData), {
      EX: this.config.lockoutDurationMinutes * 60,
    } as any);
  }

  /**
   * Check if account is locked
   */
  async isLocked(
    email: string,
  ): Promise<{ locked: boolean; lockedUntil?: Date }> {
    const data = await this.getLockoutData(email);

    if (!data) {
      return { locked: false };
    }

    const lockedUntil = new Date(data.lockedUntil);

    if (lockedUntil <= new Date()) {
      // Lock expired
      await this.clearLockout(email);
      return { locked: false };
    }

    if (data.attempts >= this.config.maxAttempts) {
      return { locked: true, lockedUntil };
    }

    return { locked: false };
  }

  /**
   * Clear lockout (on successful login)
   */
  async clearLockout(email: string): Promise<void> {
    const key = this.getLockoutKey(email);
    await this.redis.del(key).then(() => undefined);
  }

  /**
   * Get lockout data
   */
  private async getLockoutData(email: string): Promise<LockoutData | null> {
    const key = this.getLockoutKey(email);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as LockoutData;
  }
}
