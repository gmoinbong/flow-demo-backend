import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RoleService } from '../services/role.service';
import { NotFoundException } from '@nestjs/common';

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

    return {
      id: updatedUser.id,
      email: updatedUser.email.getValue(),
      role: input.role,
    };
  }
}


