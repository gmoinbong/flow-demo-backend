/**
 * Creator-Brand relationship entity
 */
export enum RelationshipRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  COLLABORATOR = 'collaborator',
}

export enum RelationshipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

export class CreatorBrandRelationship {
  private constructor(
    public readonly id: string,
    public readonly creatorId: string,
    public readonly brandId: string,
    public readonly role: RelationshipRole,
    public readonly status: RelationshipStatus,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    creatorId: string,
    brandId: string,
    role: RelationshipRole = RelationshipRole.COLLABORATOR,
    status: RelationshipStatus = RelationshipStatus.PENDING,
    createdAt: Date = new Date(),
  ): CreatorBrandRelationship {
    return new CreatorBrandRelationship(
      id,
      creatorId,
      brandId,
      role,
      status,
      createdAt,
    );
  }

  static fromPersistence(
    id: string,
    creatorId: string,
    brandId: string,
    role: string,
    status: string,
    createdAt: Date,
  ): CreatorBrandRelationship {
    return new CreatorBrandRelationship(
      id,
      creatorId,
      brandId,
      role as RelationshipRole,
      status as RelationshipStatus,
      createdAt,
    );
  }

  /**
   * Activate relationship
   */
  activate(): CreatorBrandRelationship {
    return new CreatorBrandRelationship(
      this.id,
      this.creatorId,
      this.brandId,
      this.role,
      RelationshipStatus.ACTIVE,
      this.createdAt,
    );
  }

  /**
   * Deactivate relationship
   */
  deactivate(): CreatorBrandRelationship {
    return new CreatorBrandRelationship(
      this.id,
      this.creatorId,
      this.brandId,
      this.role,
      RelationshipStatus.INACTIVE,
      this.createdAt,
    );
  }

  /**
   * Update role
   */
  updateRole(role: RelationshipRole): CreatorBrandRelationship {
    return new CreatorBrandRelationship(
      this.id,
      this.creatorId,
      this.brandId,
      role,
      this.status,
      this.createdAt,
    );
  }
}

