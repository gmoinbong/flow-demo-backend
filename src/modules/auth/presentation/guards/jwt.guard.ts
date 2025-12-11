import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../../application/services/jwt.service';
import { AUTH_DI_TOKENS } from '../../auth.tokens';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RoleService } from '../../application/services/role.service';
import type { IProfileRepository } from '../../../profile/domain/repositories/profile.repository.interface';
import { PROFILE_DI_TOKENS } from '../../../profile/profile.tokens';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_DI_TOKENS.JWT_SERVICE)
    private readonly jwtService: JwtService,
    @Inject(AUTH_DI_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_DI_TOKENS.ROLE_SERVICE)
    private readonly roleService: RoleService,
    @Inject(PROFILE_DI_TOKENS.PROFILE_REPOSITORY)
    private readonly profileRepository: IProfileRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user from database to get roleId
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get role name by roleId
      let roleName: string | undefined;
      if (user.roleId) {
        roleName = await this.roleService.getRoleNameById(user.roleId) || undefined;
      }

      // Get profile to check onboarding status
      let onboardingComplete = false;
      try {
        const profile = await this.profileRepository.findByUserId(user.id);
        if (profile && profile.status.value === 'active') {
          onboardingComplete = true;
        }
      } catch (error) {
        // Profile may not exist yet, onboardingComplete stays false
        console.log('Profile not found for user', user.id);
      }

      // Attach user info to request
      (request as any).user = {
        id: user.id,
        email: user.email.getValue(),
        roleId: user.roleId,
        role: roleName,
        onboardingComplete,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
