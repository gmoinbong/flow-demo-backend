import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/presentation/decorators/current-user.decorator';
import { User } from 'src/modules/auth/domain/entities/user.entity';
import { FetchPostsUseCase } from '../../application/use-cases/fetch-posts.use-case';
import { FetchPostsDto, FetchPostsDtoSchema } from '../dto/fetch-posts.dto';
import { createZodDto } from '@anatine/zod-nestjs';
import { FetchPostsResponseDto } from '../dto/scraper-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt.guard';

class FetchPostsRequestDto extends createZodDto(FetchPostsDtoSchema) {}

@Controller('scraper')
@ApiTags('Scraper')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
export class ScraperController {
  constructor(private readonly fetchPostsUseCase: FetchPostsUseCase) {}

  @Post('posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch posts from social platform',
    description: `
      Скрапинг постов из Instagram, TikTok, YouTube через Apify по username.
      
      **Пример:** username="mrbeast", platform="youtube"
      
      **Фильтрация:**
      - brandId + campaignId → посты с начала кампании
      - без фильтров → все посты (до limit)
      
      **Ответ:** posts[], totalCount, filteredBy
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Posts fetched successfully',
    type: FetchPostsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (validation error or missing required fields)',
  })
  @ApiResponse({
    status: 404,
    description: 'Social account not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error (Apify service error or database error)',
  })
  async fetchPosts(
    @CurrentUser() user: User,
    @Body() dto: FetchPostsRequestDto,
  ) {
    const result = await this.fetchPostsUseCase.execute({
      username: dto.username,
      platform: dto.platform,
      brandId: dto.brandId,
      campaignId: dto.campaignId,
      limit: dto.limit,
    });

    return {
      posts: result.posts,
      totalCount: result.totalCount,
      filteredBy: result.filteredBy,
    };
  }
}

