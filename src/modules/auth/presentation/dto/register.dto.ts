import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const RegisterDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['creator', 'brand']), // User role: creator or brand
  // Common fields
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  // Brand-specific fields
  company: z.string().min(1).optional(),
  companySize: z.string().optional(),
  userRole: z.string().optional(), // Role in company (marketing-manager, etc.)
});

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}


