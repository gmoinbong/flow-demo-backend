import { NotFoundException } from '@nestjs/common';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { Profile } from '../../domain/entities/profile.entity';

export interface UpdateProfileCommand {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(command: UpdateProfileCommand): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(command.userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const updatedProfile = profile.update(
      command.firstName !== undefined ? command.firstName : profile.firstName,
      command.lastName !== undefined ? command.lastName : profile.lastName,
      command.displayName !== undefined ? command.displayName : profile.displayName,
      command.bio !== undefined ? command.bio : profile.bio,
      command.avatarUrl !== undefined ? command.avatarUrl : profile.avatarUrl,
    );

    return await this.profileRepository.save(updatedProfile);
  }
}

