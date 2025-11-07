import * as bcrypt from 'bcrypt';

/**
 * Password service - handles password hashing and comparison
 */
export class PasswordService {
  private readonly saltRounds = 10;

  /**
   * Hash plain password
   */
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  /**
   * Compare plain password with hash
   */
  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}

