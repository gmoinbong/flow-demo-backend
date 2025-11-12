import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const UpdateCreatorSchema = z.object({
  displayName: z.string().min(2).max(100).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export class UpdateCreatorDto {
  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
    required: false,
    minLength: 2,
    maxLength: 100,
    nullable: true,
  })
  displayName?: string | null;

  @ApiProperty({
    description: 'Bio/description',
    example: 'Content creator',
    required: false,
    maxLength: 1000,
    nullable: true,
  })
  bio?: string | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
    nullable: true,
  })
  avatarUrl?: string | null;
}

