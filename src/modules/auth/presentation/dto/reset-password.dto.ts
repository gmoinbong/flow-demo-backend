import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const RequestPasswordResetDtoSchema = z.object({
  email: z.string().email(),
});

export class RequestPasswordResetDto extends createZodDto(RequestPasswordResetDtoSchema) {}

export const VerifyResetTokenDtoSchema = z.object({
  resetToken: z.string(),
});

export class VerifyResetTokenDto extends createZodDto(VerifyResetTokenDtoSchema) {}

export const ResetPasswordDtoSchema = z.object({
  resetToken: z.string(),
  newPassword: z.string().min(8).max(100),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordDtoSchema) {}


