import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class LoginDto extends createZodDto(LoginDtoSchema) {}


