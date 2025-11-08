import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Profile unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID associated with this profile',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'Display name (can be different from first/last name)',
    example: 'Johnny D',
    required: false,
    nullable: true,
  })
  displayName: string | null;

  @ApiProperty({
    description: 'Profile biography/description',
    example: 'Content creator specializing in tech reviews',
    required: false,
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: 'URL to profile avatar image',
    example: 'https://example.com/avatars/john.jpg',
    required: false,
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: 'Profile status',
    example: 'active',
    enum: ['active', 'pending', 'suspended'],
  })
  status: string;

  @ApiProperty({
    description: 'Profile creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Profile last update timestamp',
    example: '2024-01-20T14:45:00Z',
  })
  updatedAt: Date;
}

