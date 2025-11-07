import { BrandTypeVO } from '../value-objects/brand-type.vo';

/**
 * Brand domain entity
 */
export class Brand {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly websiteUrl: string | null,
    public readonly logoUrl: string | null,
    public readonly brandType: BrandTypeVO,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    name: string,
    description: string | null,
    websiteUrl: string | null,
    logoUrl: string | null,
    brandType: BrandTypeVO,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Brand {
    return new Brand(
      id,
      name,
      description,
      websiteUrl,
      logoUrl,
      brandType,
      createdAt,
      updatedAt,
    );
  }

  static fromPersistence(
    id: string,
    name: string,
    description: string | null,
    websiteUrl: string | null,
    logoUrl: string | null,
    brandType: string,
    createdAt: Date,
    updatedAt: Date,
  ): Brand {
    return new Brand(
      id,
      name,
      description,
      websiteUrl,
      logoUrl,
      BrandTypeVO.create(brandType),
      createdAt,
      updatedAt,
    );
  }

  /**
   * Update brand information
   */
  update(
    name: string,
    description: string | null,
    websiteUrl: string | null,
    logoUrl: string | null,
  ): Brand {
    return new Brand(
      this.id,
      name,
      description,
      websiteUrl,
      logoUrl,
      this.brandType,
      this.createdAt,
      new Date(),
    );
  }
}

