import { ApiProperty } from '@nestjs/swagger';

export class AddSocialProfileDto {
  @ApiProperty({
    description: 'Social media platform',
    enum: ['instagram', 'tiktok', 'youtube'],
    example: 'instagram',
  })
  platform: 'instagram' | 'tiktok' | 'youtube';

  @ApiProperty({
    description: 'Username or handle on the platform',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Profile URL',
    example: 'https://instagram.com/johndoe',
    required: false,
  })
  profileUrl?: string;

  @ApiProperty({
    description: 'Number of followers (declared)',
    example: 50000,
    required: false,
    minimum: 0,
  })
  followersDeclared?: number;

  @ApiProperty({
    description: 'Engagement rate (declared) as percentage',
    example: 3.5,
    required: false,
    minimum: 0,
    maximum: 100,
  })
  engagementRateDeclared?: number;

  @ApiProperty({
    description: 'Location',
    example: 'New York, USA',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'Content niches',
    example: ['fashion', 'lifestyle'],
    required: false,
    type: [String],
  })
  niches?: string[];

  @ApiProperty({
    description: 'Is this the primary profile',
    example: true,
    required: false,
    default: false,
  })
  isPrimary?: boolean;
}

