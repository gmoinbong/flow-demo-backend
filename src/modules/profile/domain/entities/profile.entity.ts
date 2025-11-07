import { CreatorStatusVO } from '../../../creator/domain/value-objects/creator-status.vo';

/**
 * Profile domain entity
 */
export class Profile {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly firstName: string | null,
    public readonly lastName: string | null,
    public readonly displayName: string | null,
    public readonly bio: string | null,
    public readonly avatarUrl: string | null,
    public readonly status: CreatorStatusVO,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromPersistence(
    id: string,
    userId: string,
    firstName: string | null,
    lastName: string | null,
    displayName: string | null,
    bio: string | null,
    avatarUrl: string | null,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ): Profile {
    return new Profile(
      id,
      userId,
      firstName,
      lastName,
      displayName,
      bio,
      avatarUrl,
      CreatorStatusVO.create(status),
      createdAt,
      updatedAt,
    );
  }

  /**
   * Update profile information
   */
  update(
    firstName: string | null,
    lastName: string | null,
    displayName: string | null,
    bio: string | null,
    avatarUrl: string | null,
  ): Profile {
    return new Profile(
      this.id,
      this.userId,
      firstName,
      lastName,
      displayName,
      bio,
      avatarUrl,
      this.status,
      this.createdAt,
      new Date(),
    );
  }
}

