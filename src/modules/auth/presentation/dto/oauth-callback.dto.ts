import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const OAuthCallbackResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  isNewUser: z.boolean(),
});

export class OAuthCallbackResponseDto extends createZodDto(
  OAuthCallbackResponseSchema,
) {}



