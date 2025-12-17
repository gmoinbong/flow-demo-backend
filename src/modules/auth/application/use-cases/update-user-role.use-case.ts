import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RoleService } from '../services/role.service';
import { NotFoundException } from '@nestjs/common';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { profile } from 'src/shared/core/infrastructure/database/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface UpdateUserRoleInput {
  userId: string;
  role: 'creator' | 'brand';
}

export interface UpdateUserRoleOutput {
  id: string;
  email: string;
  role: string;
}

export class UpdateUserRoleUseCase
  implements UseCase<UpdateUserRoleInput, UpdateUserRoleOutput> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleService: RoleService,
    private readonly db: Database,
  ) { }

  async execute(input: UpdateUserRoleInput): Promise<UpdateUserRoleOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create role
    const roleId = await this.roleService.ensureRoleExists(input.role);
    if (!roleId) {
      throw new Error(`Failed to get role ID for role: ${input.role}`);
    }

    // Update user role
    const updatedUser = user.updateRole(roleId);
    await this.userRepository.save(updatedUser);

    // Check if profile exists, if not create it
    const existingProfile = await this.db
      .select()
      .from(profile)
      .where(eq(profile.user_id, user.id))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create profile for OAuth users who don't have one
      const now = new Date();
      const emailPart = user.email.getValue().split('@')[0];
      
      await this.db.insert(profile).values({
        id: randomUUID(),
        user_id: user.id,
        first_name: emailPart,
        last_name: '',
        display_name: emailPart,
        bio: null,
        avatar_url: null,
        status: 'pending', // Default status for new profiles
        created_at: now,
        updated_at: now,
      });
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email.getValue(),
      role: input.role,
    };
  }
}


