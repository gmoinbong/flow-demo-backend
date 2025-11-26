import { Injectable, Inject } from '@nestjs/common';
import type { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { Creator } from '../../domain/entities/creator.entity';
import { CreatorStatusVO } from '../../domain/value-objects/creator-status.vo';
import { CreatorValidatorService } from '../services/creator-validator.service';
import { CREATOR_DI_TOKENS } from '../../creator.tokens';

export interface CreateCreatorCommand {
  userId: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  status?: string;
}

@Injectable()
export class CreateCreatorUseCase {
  constructor(
    @Inject(CREATOR_DI_TOKENS.CREATOR_REPOSITORY)
    private readonly creatorRepository: ICreatorRepository,
    @Inject(CREATOR_DI_TOKENS.CREATOR_VALIDATOR_SERVICE)
    private readonly validator: CreatorValidatorService,
  ) {}

  async execute(command: CreateCreatorCommand): Promise<Creator> {
    // Validate input
    if (command.displayName && !this.validator.validateDisplayName(command.displayName)) {
      throw new Error('Invalid display name');
    }

    if (command.bio && !this.validator.validateBio(command.bio)) {
      throw new Error('Invalid bio');
    }

    if (command.avatarUrl && !this.validator.validateAvatarUrl(command.avatarUrl)) {
      throw new Error('Invalid avatar URL');
    }

    // Check if creator already exists for this user
    const existingCreator = await this.creatorRepository.findByUserId(command.userId);
    if (existingCreator) {
      throw new Error('Creator already exists for this user');
    }

    // Create creator
    // Note: Role is determined by users.role_id -> user_role, not stored in profile
    const creator = Creator.create(
      crypto.randomUUID(),
      command.userId,
      command.displayName || null,
      command.bio || null,
      command.avatarUrl || null,
      command.status ? CreatorStatusVO.create(command.status) : CreatorStatusVO.pending(),
    );

    // Save to repository
    return await this.creatorRepository.save(creator);
  }
}

