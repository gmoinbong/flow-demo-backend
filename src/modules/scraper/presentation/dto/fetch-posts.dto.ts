import { z } from 'zod';

export const FetchPostsDtoSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  platform: z.enum(['instagram', 'tiktok', 'youtube'], {
    errorMap: () => ({ message: 'Platform must be one of: instagram, tiktok, youtube' }),
  }),
  brandId: z.string().uuid('Invalid brand ID').optional(),
  campaignId: z.string().uuid('Invalid campaign ID').optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export type FetchPostsDto = z.infer<typeof FetchPostsDtoSchema>;

