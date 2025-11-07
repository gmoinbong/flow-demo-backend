import { ICreatorBrandRepository } from '../../domain/repositories/creator-brand.repository.interface';
import { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';
import { CreatorBrandRelationship, RelationshipRole, RelationshipStatus } from '../../domain/entities/creator-brand-relationship.entity';

export interface LinkCreatorToBrandCommand {
  creatorId: string;
  brandId: string;
  role?: string;
}

export class LinkCreatorToBrandUseCase {
  constructor(
    private readonly creatorRepository: ICreatorRepository,
    private readonly brandRepository: IBrandRepository,
    private readonly relationshipRepository: ICreatorBrandRepository,
  ) {}

  async execute(command: LinkCreatorToBrandCommand): Promise<CreatorBrandRelationship> {
    // Verify creator exists
    const creator = await this.creatorRepository.findById(command.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Verify brand exists
    const brand = await this.brandRepository.findById(command.brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    // Check if relationship already exists
    const existing = await this.relationshipRepository.findByCreatorAndBrand(
      command.creatorId,
      command.brandId,
    );
    if (existing) {
      throw new Error('Relationship already exists');
    }

    // Create relationship
    const relationship = CreatorBrandRelationship.create(
      crypto.randomUUID(),
      command.creatorId,
      command.brandId,
      command.role ? (command.role as RelationshipRole) : RelationshipRole.COLLABORATOR,
      RelationshipStatus.PENDING,
    );

    // Save to repository
    return await this.relationshipRepository.save(relationship);
  }
}

