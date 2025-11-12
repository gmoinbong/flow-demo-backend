import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const GetCreatorsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
});

export class GetCreatorsQueryDto {
  @ApiProperty({
    description: 'Number of creators to return',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  limit?: number;

  @ApiProperty({
    description: 'Number of creators to skip',
    example: 0,
    required: false,
    minimum: 0,
    default: 0,
  })
  offset?: number;

  @ApiProperty({
    description: 'Filter by creator status',
    enum: ['active', 'pending', 'suspended'],
    required: false,
  })
  status?: 'active' | 'pending' | 'suspended';
}

export class CreatorResponseDto {
  @ApiProperty({
    description: 'Creator unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID associated with creator',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
    required: false,
  })
  displayName: string | null;

  @ApiProperty({
    description: 'Bio/description',
    example: 'Content creator',
    required: false,
  })
  bio: string | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: 'Creator status',
    enum: ['active', 'pending', 'suspended'],
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}

export class GetCreatorsResponseDto {
  @ApiProperty({
    description: 'List of creators',
    type: [CreatorResponseDto],
  })
  creators: CreatorResponseDto[];

  @ApiProperty({
    description: 'Total number of creators',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Limit used',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Offset used',
    example: 0,
  })
  offset: number;
}

