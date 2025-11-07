import { Password } from '../value-objects/password.vo';
import { Email } from '../value-objects/email.vo';

/**
 * Domain User entity
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    private password: Password | null,
    public readonly roleId: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    email: Email,
    password: Password | null,
    roleId: number | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): User {
    return new User(id, email, password, roleId, createdAt, updatedAt);
  }

  static fromPersistence(
    id: string,
    email: string,
    passwordHash: string | null,
    roleId: number | null,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(
      id,
      Email.create(email),
      passwordHash ? Password.fromHash(passwordHash) : null,
      roleId,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Check if user has password set
   */
  hasPassword(): boolean {
    return this.password !== null;
  }

  /**
   * Get password hash (for persistence)
   */
  getPasswordHash(): string | null {
    return this.password?.getHash() || null;
  }

  /**
   * Compare password with plain text
   */
  async comparePassword(
    plainPassword: string,
    compareFn: (plain: string, hash: string) => Promise<boolean>,
  ): Promise<boolean> {
    if (!this.password) {
      return false;
    }
    return this.password.compare(plainPassword, compareFn);
  }

  /**
   * Update password
   */
  updatePassword(newPassword: Password): User {
    return new User(
      this.id,
      this.email,
      newPassword,
      this.roleId,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update role
   */
  updateRole(roleId: number | null): User {
    return new User(
      this.id,
      this.email,
      this.password,
      roleId,
      this.createdAt,
      new Date(),
    );
  }
}
