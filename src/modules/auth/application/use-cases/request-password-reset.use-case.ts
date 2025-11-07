import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { Email } from '../../domain/value-objects/email.vo';
import { IResetTokenRepository } from '../../infrastructure/persistence/reset-token.repository';
import { UserNotFoundError } from '../../domain/errors/auth-errors';
import { randomBytes } from 'crypto';

export interface RequestPasswordResetInput {
  email: string;
}

export interface RequestPasswordResetOutput {
  resetToken: string;
  expiresAt: Date;
}

/**
 * Request password reset use case
 */
export class RequestPasswordResetUseCase
  implements UseCase<RequestPasswordResetInput, RequestPasswordResetOutput>
{
  private readonly resetTokenExpiryMinutes = 15;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetTokenRepository: IResetTokenRepository,
  ) {}

  async execute(
    input: RequestPasswordResetInput,
  ): Promise<RequestPasswordResetOutput> {
    const email = Email.create(input.email);

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists (security best practice)
      // Return success anyway
      return this.generateDummyResponse();
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.resetTokenExpiryMinutes);

    // Save reset token
    await this.resetTokenRepository.save(
      resetToken,
      user.id,
      expiresAt,
    );

    // TODO: Send email with reset link
    // This would be done via domain event or external service

    return {
      resetToken,
      expiresAt,
    };
  }

  /**
   * Generate dummy response to prevent user enumeration
   */
  private generateDummyResponse(): RequestPasswordResetOutput {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.resetTokenExpiryMinutes);
    return {
      resetToken: '', // Empty token (user doesn't exist)
      expiresAt,
    };
  }
}


