import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const CompleteCreatorOnboardingDtoSchema = z.object({
  instagramHandle: z.string().optional(),
  instagramFollowers: z.number().int().min(0).optional(),
  tiktokHandle: z.string().optional(),
  tiktokFollowers: z.number().int().min(0).optional(),
  youtubeHandle: z.string().optional(),
  youtubeSubscribers: z.number().int().min(0).optional(),
  niche: z.array(z.string()).optional(),
  bio: z.string().optional(),
  audienceLocation: z.string().optional(),
});

export class CompleteCreatorOnboardingDto extends createZodDto(CompleteCreatorOnboardingDtoSchema) {}

