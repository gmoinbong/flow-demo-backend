import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const UpdateProfileDtoSchema = z.object({
  firstName: z.string().min(1).optional().nullable(),
  lastName: z.string().min(1).optional().nullable(),
  displayName: z.string().min(1).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
  // Brand-specific fields
  companySize: z.string().optional().nullable(),
  userRole: z.string().optional().nullable(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileDtoSchema) {}

