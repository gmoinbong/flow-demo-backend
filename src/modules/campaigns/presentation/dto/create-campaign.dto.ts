import { ApiProperty } from '@nestjs/swagger';

export class TrackingConfigDto {
  @ApiProperty({
    example: ['#brandname', '#sponsored'],
    description: 'Required hashtags for campaign post detection',
    type: [String],
    required: false,
  })
  requiredHashtags?: string[];

  @ApiProperty({
    example: ['#fashion', '#lifestyle'],
    description: 'Optional hashtags (bonus points)',
    type: [String],
    required: false,
  })
  optionalHashtags?: string[];

  @ApiProperty({
    example: ['@brandname'],
    description: 'Required mentions for campaign post detection',
    type: [String],
    required: false,
  })
  requiredMentions?: string[];

  @ApiProperty({
    example: 'tracking-link-pattern',
    description: 'Pattern for tracking links',
    required: false,
  })
  trackingLinkPattern?: string;

  @ApiProperty({
    example: 0.7,
    description: 'Minimum confidence score (0-1) for auto-detection',
    minimum: 0,
    maximum: 1,
    required: false,
    default: 0.7,
  })
  minMatchConfidence?: number;
}

export class CreateCampaignDto {
  @ApiProperty({
    example: 'Summer 2025 Campaign',
    description: 'Campaign name',
  })
  name: string;

  @ApiProperty({
    example: 'Promote summer collection',
    description: 'Campaign description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 1000000,
    description: 'Campaign budget in cents',
    minimum: 1,
  })
  budget: number;

  @ApiProperty({
    example: ['reach', 'engagement', 'conversions'],
    description: 'Campaign goals',
    type: [String],
  })
  goals: string[];

  @ApiProperty({
    example: 'Fashion enthusiasts, 18-35',
    description: 'Target audience description',
    required: false,
  })
  targetAudience?: string;

  @ApiProperty({
    example: ['instagram', 'tiktok'],
    description: 'Target platforms',
    type: [String],
    enum: ['instagram', 'tiktok', 'youtube'],
  })
  platforms: string[];

  @ApiProperty({
    example: 'mid-tier',
    description: 'Target audience size',
    enum: ['micro', 'mid-tier', 'macro', 'mega'],
    required: false,
  })
  audienceSize?: 'micro' | 'mid-tier' | 'macro' | 'mega';

  @ApiProperty({
    example: 'United States',
    description: 'Target location',
    required: false,
  })
  targetLocation?: string;

  @ApiProperty({
    example: '2025-06-01T00:00:00Z',
    description: 'Campaign start date (ISO 8601)',
  })
  startDate: string;

  @ApiProperty({
    example: '2025-08-31T23:59:59Z',
    description: 'Campaign end date (ISO 8601)',
  })
  endDate: string;

  @ApiProperty({
    type: TrackingConfigDto,
    description: 'Tracking configuration for campaign post detection',
    required: false,
  })
  trackingConfig?: TrackingConfigDto;
}


