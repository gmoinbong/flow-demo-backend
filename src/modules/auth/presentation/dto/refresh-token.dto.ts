import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string(),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenDtoSchema) {}


