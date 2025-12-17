import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const UpdateProfileDtoSchema = z.object({
  firstName: z.string().min(1).optional().nullable(),
  lastName: z.string().min(1).optional().nullable(),
  displayName: z.string().min(1).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileDtoSchema) {}

