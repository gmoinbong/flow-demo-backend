/**
 * JWT Token value object
 */
export class JwtToken {
  private constructor(
    private readonly token: string,
    private readonly expiresAt: Date,
  ) {}

  static create(token: string, expiresAt: Date): JwtToken {
    if (expiresAt < new Date()) {
      throw new Error('Token expiration date must be in the future');
    }
    return new JwtToken(token, expiresAt);
  }

  getValue(): string {
    return this.token;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  equals(other: JwtToken): boolean {
    return this.token === other.token;
  }
}


