import { eq } from 'drizzle-orm';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { Profile } from '../../domain/entities/profile.entity';
import { NotFoundError } from 'src/shared/core/domain/errors';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { brands } from 'src/shared/core/infrastructure/database/schema';

export interface GetProfileOutput {
  profile: {
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  brand?: {
    id: string;
    name: string;
    description: string | null;
    websiteUrl: string | null;
    logoUrl: string | null;
    brandType: string | null;
    companySize: string | null;
    userRole: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class GetProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly db: Database,
  ) {}

  async execute(userId: string): Promise<GetProfileOutput> {
    const profileEntity = await this.profileRepository.findByUserId(userId);
    if (!profileEntity) {
      throw new NotFoundError('Profile not found');
    }

    // Try to find brand linked to this profile
    let brandData: any = null;
    try {
      const brandResult = await this.db
        .select()
        .from(brands)
        .where(eq(brands.profile_id, profileEntity.id))
        .limit(1);

      if (brandResult.length > 0) {
        brandData = brandResult[0];
      }
    } catch (error) {
      // Brand not found is not an error
      console.error('Error fetching brand:', error);
    }

    const result: GetProfileOutput = {
      profile: {
        id: profileEntity.id,
        userId: profileEntity.userId,
        firstName: profileEntity.firstName,
        lastName: profileEntity.lastName,
        displayName: profileEntity.displayName,
        bio: profileEntity.bio,
        avatarUrl: profileEntity.avatarUrl,
        status: profileEntity.status.value,
        createdAt: profileEntity.createdAt,
        updatedAt: profileEntity.updatedAt,
      },
    };

    if (brandData) {
      result.brand = {
        id: brandData.id,
        name: brandData.name,
        description: brandData.description || null,
        websiteUrl: brandData.website_url || null,
        logoUrl: brandData.logo_url || null,
        brandType: brandData.brand_type || null,
        companySize: brandData.company_size || null,
        userRole: brandData.user_role || null,
        createdAt: brandData.created_at,
        updatedAt: brandData.updated_at,
      };
    }

    return result;
  }
}

