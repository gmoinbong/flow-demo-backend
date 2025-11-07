import { CreatorStatusVO } from '../value-objects/creator-status.vo';

/**
 * Creator domain entity
 * Extends profile concept from auth module
 * Role is stored in users.role_id -> user_role, not in profile
 */
export class Creator {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly displayName: string | null,
    public readonly bio: string | null,
    public readonly avatarUrl: string | null,
    public readonly status: CreatorStatusVO,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    userId: string,
    displayName: string | null,
    bio: string | null,
    avatarUrl: string | null,
    status: CreatorStatusVO = CreatorStatusVO.pending(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Creator {
    return new Creator(
      id,
      userId,
      displayName,
      bio,
      avatarUrl,
      status,
      createdAt,
      updatedAt,
    );
  }

  static fromPersistence(
    id: string,
    userId: string,
    displayName: string | null,
    bio: string | null,
    avatarUrl: string | null,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ): Creator {
    return new Creator(
      id,
      userId,
      displayName,
      bio,
      avatarUrl,
      CreatorStatusVO.create(status),
      createdAt,
      updatedAt,
    );
  }

  /**
   * Update creator profile
   */
  updateProfile(
    displayName: string | null,
    bio: string | null,
    avatarUrl: string | null,
  ): Creator {
    return new Creator(
      this.id,
      this.userId,
      displayName,
      bio,
      avatarUrl,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Activate creator
   */
  activate(): Creator {
    return new Creator(
      this.id,
      this.userId,
      this.displayName,
      this.bio,
      this.avatarUrl,
      CreatorStatusVO.active(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Suspend creator
   */
  suspend(): Creator {
    return new Creator(
      this.id,
      this.userId,
      this.displayName,
      this.bio,
      this.avatarUrl,
      CreatorStatusVO.suspended(),
      this.createdAt,
      new Date(),
    );
  }
}

