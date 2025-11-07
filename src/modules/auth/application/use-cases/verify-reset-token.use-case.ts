import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IResetTokenRepository } from '../../infrastructure/persistence/reset-token.repository';
import { InvalidResetTokenError } from '../../domain/errors/auth-errors';

export interface VerifyResetTokenInput {
  resetToken: string;
}

export interface VerifyResetTokenOutput {
  valid: boolean;
  expiresAt?: Date;
}

/**
 * Verify reset token use case
 */
export class VerifyResetTokenUseCase
  implements UseCase<VerifyResetTokenInput, VerifyResetTokenOutput>
{
  constructor(
    private readonly resetTokenRepository: IResetTokenRepository,
  ) {}

  async execute(
    input: VerifyResetTokenInput,
  ): Promise<VerifyResetTokenOutput> {
    const tokenData = await this.resetTokenRepository.get(input.resetToken);

    if (!tokenData) {
      return { valid: false };
    }

    // Check expiration
    if (new Date(tokenData.expiresAt) < new Date()) {
      await this.resetTokenRepository.delete(input.resetToken);
      return { valid: false };
    }

    return {
      valid: true,
      expiresAt: new Date(tokenData.expiresAt),
    };
  }
}


