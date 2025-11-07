import { IBrandRepository } from '../../domain/repositories/brand.repository.interface';
import { Brand } from '../../domain/entities/brand.entity';
import { BrandTypeVO } from '../../domain/value-objects/brand-type.vo';
import { BrandValidatorService } from '../services/brand-validator.service';

export interface CreateBrandCommand {
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  brandType: string;
}

export class CreateBrandUseCase {
  constructor(
    private readonly brandRepository: IBrandRepository,
    private readonly validator: BrandValidatorService,
  ) {}

  async execute(command: CreateBrandCommand): Promise<Brand> {
    // Validate input
    if (!this.validator.validateName(command.name)) {
      throw new Error('Invalid brand name');
    }

    if (command.description && !this.validator.validateDescription(command.description)) {
      throw new Error('Invalid description');
    }

    if (command.websiteUrl && !this.validator.validateWebsiteUrl(command.websiteUrl)) {
      throw new Error('Invalid website URL');
    }

    if (command.logoUrl && !this.validator.validateLogoUrl(command.logoUrl)) {
      throw new Error('Invalid logo URL');
    }

    // Create brand
    const brand = Brand.create(
      crypto.randomUUID(),
      command.name,
      command.description || null,
      command.websiteUrl || null,
      command.logoUrl || null,
      BrandTypeVO.create(command.brandType),
    );

    // Save to repository
    return await this.brandRepository.save(brand);
  }
}

