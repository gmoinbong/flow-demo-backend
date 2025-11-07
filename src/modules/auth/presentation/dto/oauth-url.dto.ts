import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const OAuthUrlResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string(),
});

export class OAuthUrlResponseDto extends createZodDto(
  OAuthUrlResponseSchema,
) {}



