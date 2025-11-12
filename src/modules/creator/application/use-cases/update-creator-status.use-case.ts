import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { Creator } from '../../domain/entities/creator.entity';
import { CreatorStatusVO } from '../../domain/value-objects/creator-status.vo';
import { CREATOR_DI_TOKENS } from '../../creator.tokens';

export interface UpdateCreatorStatusCommand {
  creatorId: string;
  status: 'active' | 'pending' | 'suspended';
}

@Injectable()
export class UpdateCreatorStatusUseCase {
  constructor(
    @Inject(CREATOR_DI_TOKENS.CREATOR_REPOSITORY)
    private readonly creatorRepository: ICreatorRepository,
  ) {}

  async execute(command: UpdateCreatorStatusCommand): Promise<Creator> {
    const creator = await this.creatorRepository.findById(command.creatorId);

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    let updatedCreator: Creator;

    switch (command.status) {
      case 'active':
        updatedCreator = creator.activate();
        break;
      case 'suspended':
        updatedCreator = creator.suspend();
        break;
      case 'pending':
        // Keep current status or set to pending
        updatedCreator = Creator.fromPersistence(
          creator.id,
          creator.userId,
          creator.displayName,
          creator.bio,
          creator.avatarUrl,
          'pending',
          creator.createdAt,
          new Date(),
        );
        break;
      default:
        throw new Error(`Invalid status: ${command.status}`);
    }

    // Save updated creator
    await this.creatorRepository.save(updatedCreator);

    // Reload from database to ensure we have the latest data
    const savedCreator = await this.creatorRepository.findById(command.creatorId);
    
    if (!savedCreator) {
      throw new NotFoundException('Creator not found after update');
    }

    return savedCreator;
  }
}

