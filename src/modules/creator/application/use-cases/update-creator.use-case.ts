import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { Creator } from '../../domain/entities/creator.entity';
import { CREATOR_DI_TOKENS } from '../../creator.tokens';

export interface UpdateCreatorCommand {
  creatorId: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

@Injectable()
export class UpdateCreatorUseCase {
  constructor(
    @Inject(CREATOR_DI_TOKENS.CREATOR_REPOSITORY)
    private readonly creatorRepository: ICreatorRepository,
  ) {}

  async execute(command: UpdateCreatorCommand): Promise<Creator> {
    const creator = await this.creatorRepository.findById(command.creatorId);

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Update creator profile
    const updatedCreator = creator.updateProfile(
      command.displayName !== undefined ? command.displayName : creator.displayName,
      command.bio !== undefined ? command.bio : creator.bio,
      command.avatarUrl !== undefined ? command.avatarUrl : creator.avatarUrl,
    );

    return await this.creatorRepository.save(updatedCreator);
  }
}

