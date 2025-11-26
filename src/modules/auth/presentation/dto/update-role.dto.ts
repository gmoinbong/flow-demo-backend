import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const UpdateRoleDtoSchema = z.object({
  role: z.enum(['creator', 'brand']),
});

export class UpdateRoleDto extends createZodDto(UpdateRoleDtoSchema) {}

