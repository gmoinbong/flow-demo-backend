import { ApiProperty } from '@nestjs/swagger';

export class CampaignResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Summer 2025 Campaign' })
  name: string;

  @ApiProperty({
    example: 'draft',
    enum: ['draft', 'active', 'paused', 'completed'],
  })
  status: string;

  @ApiProperty({ example: 1000000, description: 'Budget in cents' })
  budget: number;

  @ApiProperty({
    example: 1000000,
    description: 'Current budget after reallocation',
  })
  currentBudget: number;

  @ApiProperty({ example: ['2025-01-01T00:00:00Z'] })
  startDate: Date;

  @ApiProperty({ example: '2025-12-31T23:59:59Z' })
  endDate: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00Z', required: false })
  createdAt?: Date;
}

export class CampaignDetailResponseDto extends CampaignResponseDto {
  @ApiProperty({ example: 'Campaign description', required: false })
  description?: string;

  @ApiProperty({ example: ['reach', 'engagement'], type: [String] })
  goals: string[];

  @ApiProperty({ example: ['instagram', 'tiktok'], type: [String] })
  platforms: string[];
}

export class AllocationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  creatorId: string;

  @ApiProperty({ example: 500000, description: 'Allocated budget in cents' })
  allocatedBudget: number;

  @ApiProperty({ example: 500000, description: 'Current budget in cents' })
  currentBudget: number;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'accepted', 'active', 'completed', 'declined'],
  })
  status: string;

  @ApiProperty({ example: 10000, description: 'Total reach' })
  reach: number;

  @ApiProperty({ example: 5000, description: 'Total engagement' })
  engagement: number;

  @ApiProperty({ example: 10, description: 'Number of campaign posts' })
  postsCount: number;
}

class CampaignInfoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({
    example: 'active',
    enum: ['draft', 'active', 'paused', 'completed'],
  })
  status: string;
}

class AllocationInfoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  creatorId: string;

  @ApiProperty({ example: 1000000, description: 'Allocated budget in cents' })
  allocatedBudget: number;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'accepted', 'active', 'completed', 'declined'],
  })
  status: string;
}

class CreatorInfoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: 'creator_username' })
  username: string;

  @ApiProperty({
    example: 'instagram',
    enum: ['instagram', 'tiktok', 'youtube'],
  })
  platform: string;
}

export class ActivateCampaignResponseDto {
  @ApiProperty({ type: () => CampaignInfoDto })
  campaign: CampaignInfoDto;

  @ApiProperty({ type: () => AllocationInfoDto })
  allocation: AllocationInfoDto;

  @ApiProperty({ type: () => CreatorInfoDto })
  creator: CreatorInfoDto;
}
