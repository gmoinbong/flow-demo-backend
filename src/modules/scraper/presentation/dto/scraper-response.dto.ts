import { ApiProperty } from '@nestjs/swagger';

export class PostMetricsDto {
  @ApiProperty({
    description: 'Number of likes on the post',
    example: 1250,
    required: false,
  })
  likes?: number;

  @ApiProperty({
    description: 'Number of comments on the post',
    example: 89,
    required: false,
  })
  comments?: number;

  @ApiProperty({
    description: 'Number of shares/reposts of the post',
    example: 45,
    required: false,
  })
  shares?: number;

  @ApiProperty({
    description: 'Number of views (for video posts)',
    example: 15000,
    required: false,
  })
  views?: number;
}

export class PostDataDto {
  @ApiProperty({
    description: 'Post ID from the platform (unique identifier)',
    example: '1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Post text/caption content',
    example: 'Check out my latest video! #tech #review',
    required: false,
  })
  text?: string;

  @ApiProperty({
    description: 'URL to the post on the platform',
    example: 'https://www.instagram.com/p/ABC123/',
  })
  url: string;

  @ApiProperty({
    description: 'Post publication timestamp (ISO 8601 format)',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Post engagement metrics (likes, comments, shares, views)',
    type: PostMetricsDto,
    required: false,
    example: {
      likes: 1250,
      comments: 89,
      shares: 45,
      views: 15000,
    },
  })
  metrics?: PostMetricsDto;

  @ApiProperty({
    description: 'Array of media URLs (images/videos) associated with the post',
    example: ['https://example.com/image1.jpg', 'https://example.com/video1.mp4'],
    type: [String],
    required: false,
  })
  mediaUrls?: string[];

  @ApiProperty({
    description: 'Raw data from scraper (platform-specific format, complete original data)',
    example: {
      platformSpecific: 'data',
      additionalFields: 'from platform',
    },
    required: false,
  })
  rawData?: Record<string, any>;
}

export class FilteredByDto {
  @ApiProperty({
    description: 'Subscription date used for filtering (if brandId was provided)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  subscriptionDate?: Date;

  @ApiProperty({
    description: 'Campaign start date used for filtering (if campaignId was provided)',
    example: '2024-01-10T00:00:00Z',
    required: false,
  })
  campaignStartDate?: Date;
}

export class FetchPostsResponseDto {
  @ApiProperty({
    description: 'Array of scraped posts',
    type: [PostDataDto],
  })
  posts: PostDataDto[];

  @ApiProperty({
    description: 'Total number of posts returned',
    example: 25,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Information about applied filters',
    type: FilteredByDto,
  })
  filteredBy: FilteredByDto;
}

