import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { JwtToken } from '../../domain/value-objects/jwt-token.vo';

// Re-export JwtToken for convenience
export { JwtToken };

export interface JwtPayload {
  sub: string; // user id
  email: string;
  type: 'access' | 'refresh';
}

export interface JwtConfig {
  secret: string;
  accessTokenExpiry: string; // e.g., '15m'
  refreshTokenExpiry: string; // e.g., '7d'
}

/**
 * JWT service - handles token generation and validation
 */
export class JwtService {
  constructor(private readonly config: JwtConfig) {}

  /**
   * Generate access token
   */
  generateAccessToken(userId: string, email: string): JwtToken {
    const payload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    const expiresIn = this.config.accessTokenExpiry;
    const token = jwt.sign(payload, this.config.secret, {
      expiresIn: expiresIn,
    } as SignOptions);

    const expiresAt = this.calculateExpiry(expiresIn);

    return JwtToken.create(token, expiresAt);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string, email: string): JwtToken {
    const payload: JwtPayload = {
      sub: userId,
      email,
      type: 'refresh',
    };

    const expiresIn = this.config.refreshTokenExpiry;
    const token = jwt.sign(payload, this.config.secret, {
      expiresIn: expiresIn,
    } as SignOptions);

    const expiresAt = this.calculateExpiry(expiresIn);

    return JwtToken.create(token, expiresAt);
  }

  /**
   * Verify and decode token
   */
  verify(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Calculate expiry date from expiresIn string
   */
  private calculateExpiry(expiresIn: string): Date {
    const now = Date.now();
    const ms = this.parseExpiresIn(expiresIn);
    return new Date(now + ms);
  }

  /**
   * Parse expiresIn string to milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}
