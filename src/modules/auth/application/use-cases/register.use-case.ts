import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { PasswordService } from '../services/password.service';
import { RoleService } from '../services/role.service';
import { UserAlreadyExistsError } from '../../domain/errors/auth-errors';
import { randomUUID } from 'crypto';
import { Database } from 'src/shared/core/infrastructure/database/database.types';
import { profile, users, brands } from 'src/shared/core/infrastructure/database/schema';
import { JwtService } from '../services/jwt.service';
import { IRefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository';

export interface RegisterInput {
  email: string;
  password: string;
  role: 'creator' | 'brand';
  firstName?: string;
  lastName?: string;
  // Brand-specific
  company?: string;
  companySize?: string;
  userRole?: string;
}

export interface RegisterOutput {
  user: {
    id: string;
    email: string;
    role: string;
  };
  profile: {
    id: string;
    status: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  accessToken: string;
}

/**
 * Register use case
 * Creates user with role and profile
 */
export class RegisterUseCase implements UseCase<RegisterInput, RegisterOutput> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly db: Database,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const email = Email.create(input.email);

    // Check if user already exists
    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      throw new UserAlreadyExistsError(email.getValue());
    }

    // Get or create role (outside transaction as it's idempotent)
    const roleId = await this.roleService.ensureRoleExists(input.role);
    if (!roleId) {
      throw new Error(`Failed to get role ID for role: ${input.role}`);
    }

    // Hash password (outside transaction)
    const passwordHash = await this.passwordService.hash(input.password);
    const password = Password.fromHash(passwordHash);

    // Use transaction to ensure atomicity - all data is saved or nothing
    return await this.db.transaction(async (tx) => {
      // Create user with role
      const userId = randomUUID();
      const now = new Date();

      // Insert user directly in transaction
      await tx.insert(users).values({
        id: userId,
        email: email.getValue(),
        password_hash: password.getHash(),
        role_id: roleId,
        created_at: now,
        updated_at: now,
      });

      // Create profile with user information
      const profileId = randomUUID();
      const displayName = input.firstName && input.lastName
        ? `${input.firstName} ${input.lastName}`.trim()
        : null;

      await tx.insert(profile).values({
        id: profileId,
        user_id: userId,
        first_name: input.firstName || null,
        last_name: input.lastName || null,
        display_name: displayName,
        bio: null,
        avatar_url: null,
        status: 'pending', // Default status for new profiles
        created_at: now,
        updated_at: now,
      });

      // Generate tokens after user creation
      const refreshToken = this.jwtService.generateRefreshToken(
        userId,
        email.getValue(),
      );
      const refreshJti = this.jwtService.getJti(refreshToken.getValue());
      
      if (!refreshJti) {
        throw new Error('Failed to generate refresh token jti');
      }

      // Save refresh token to Redis
      await this.refreshTokenRepository.save(
        refreshJti,
        userId,
        refreshToken.getExpiresAt(),
      );

      const accessToken = this.jwtService.generateAccessToken(
        userId,
        email.getValue(),
      );

      const result: RegisterOutput = {
        user: {
          id: userId,
          email: email.getValue(),
          role: input.role,
        },
        profile: {
          id: profileId,
          status: 'pending',
        },
        accessToken: accessToken.getValue(),
      };

      // If brand role, create brand record
      if (input.role === 'brand' && input.company) {
        const brandId = randomUUID();
        await tx.insert(brands).values({
          id: brandId,
          name: input.company,
          description: null,
          website_url: null,
          logo_url: null,
          brand_type: null, // Can be set later
          company_size: input.companySize || null,
          user_role: input.userRole || null,
          profile_id: profileId, // Link brand to profile
          created_at: now,
          updated_at: now,
        });

        result.brand = {
          id: brandId,
          name: input.company,
        };
      }

      return result;
    });
  }
}

