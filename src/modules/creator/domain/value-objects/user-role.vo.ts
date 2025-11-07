/**
 * User role value object
 */
export enum UserRole {
  CREATOR = 'creator',
  BRAND = 'brand',
  ADMIN = 'admin',
}

export class UserRoleVO {
  private constructor(public readonly value: UserRole) {}

  static create(role: string): UserRoleVO {
    const validRole = Object.values(UserRole).find(
      (r) => r === role.toLowerCase(),
    );
    if (!validRole) {
      throw new Error(`Invalid user role: ${role}`);
    }
    return new UserRoleVO(validRole);
  }

  static creator(): UserRoleVO {
    return new UserRoleVO(UserRole.CREATOR);
  }

  static brand(): UserRoleVO {
    return new UserRoleVO(UserRole.BRAND);
  }

  static admin(): UserRoleVO {
    return new UserRoleVO(UserRole.ADMIN);
  }

  isCreator(): boolean {
    return this.value === UserRole.CREATOR;
  }

  isBrand(): boolean {
    return this.value === UserRole.BRAND;
  }

  isAdmin(): boolean {
    return this.value === UserRole.ADMIN;
  }
}

