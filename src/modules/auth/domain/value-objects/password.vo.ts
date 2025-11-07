/**
 * Password value object - handles hashing internally
 * Password is always stored as hash, never as plain text
 */
export class Password {
  private constructor(private readonly hash: string) {}

  /**
   * Create password from hash (e.g., when loading from database)
   */
  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  /**
   * Get hash value (for persistence)
   */
  getHash(): string {
    return this.hash;
  }

  /**
   * Compare with plain text password using external service
   * This method doesn't hash internally - hash comparison is done in infrastructure layer
   */
  async compare(plainPassword: string, compareFn: (plain: string, hash: string) => Promise<boolean>): Promise<boolean> {
    return compareFn(plainPassword, this.hash);
  }

  equals(other: Password): boolean {
    return this.hash === other.hash;
  }
}


