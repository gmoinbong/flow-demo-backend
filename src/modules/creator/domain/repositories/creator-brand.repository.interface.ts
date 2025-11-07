import { CreatorBrandRelationship } from '../entities/creator-brand-relationship.entity';

/**
 * Creator-Brand relationship repository interface (domain layer)
 */
export interface ICreatorBrandRepository {
  /**
   * Find relationship by ID
   */
  findById(id: string): Promise<CreatorBrandRelationship | null>;

  /**
   * Find relationship by creator and brand IDs
   */
  findByCreatorAndBrand(
    creatorId: string,
    brandId: string,
  ): Promise<CreatorBrandRelationship | null>;

  /**
   * Find all relationships for a creator
   */
  findByCreatorId(creatorId: string): Promise<CreatorBrandRelationship[]>;

  /**
   * Find all relationships for a brand
   */
  findByBrandId(brandId: string): Promise<CreatorBrandRelationship[]>;

  /**
   * Save relationship (create or update)
   */
  save(relationship: CreatorBrandRelationship): Promise<CreatorBrandRelationship>;

  /**
   * Delete relationship
   */
  delete(id: string): Promise<void>;
}

