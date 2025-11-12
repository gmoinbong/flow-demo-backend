import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  CreateCreatorUseCase,
  type CreateCreatorCommand,
} from '../../application/use-cases/create-creator.use-case';
import { GetCreatorsUseCase } from '../../application/use-cases/get-creators.use-case';
import { GetCreatorByIdUseCase } from '../../application/use-cases/get-creator-by-id.use-case';
import { AddSocialProfileUseCase } from '../../application/use-cases/add-social-profile.use-case';
import { UpdateCreatorStatusUseCase } from '../../application/use-cases/update-creator-status.use-case';
import { UpdateCreatorUseCase } from '../../application/use-cases/update-creator.use-case';
import {
  GetCreatorsQueryDto,
  GetCreatorsResponseDto,
  CreatorResponseDto,
} from '../dto/get-creators.dto';
import { UpdateCreatorDto } from '../dto/update-creator.dto';
import { AddSocialProfileDto } from '../dto/add-social-profile.dto';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt.guard';

@Controller('creators')
@ApiTags('Creators')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
export class CreatorController {
  constructor(
    private readonly createCreatorUseCase: CreateCreatorUseCase,
    private readonly getCreatorsUseCase: GetCreatorsUseCase,
    private readonly getCreatorByIdUseCase: GetCreatorByIdUseCase,
    private readonly addSocialProfileUseCase: AddSocialProfileUseCase,
    private readonly updateCreatorStatusUseCase: UpdateCreatorStatusUseCase,
    private readonly updateCreatorUseCase: UpdateCreatorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new creator' })
  @ApiResponse({ status: 201, description: 'Creator created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async createCreator(@Body() command: CreateCreatorCommand) {
    return this.createCreatorUseCase.execute(command);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get list of creators',
    description: 'Получить список креаторов с пагинацией и фильтрацией по статусу',
  })
  @ApiResponse({
    status: 200,
    description: 'Creators retrieved successfully',
    type: GetCreatorsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getCreators(@Query() query: GetCreatorsQueryDto) {
    const result = await this.getCreatorsUseCase.execute({
      limit: query.limit,
      offset: query.offset,
      status: query.status,
    });

    return {
      creators: result.creators.map((creator) => ({
        id: creator.id,
        userId: creator.userId,
        displayName: creator.displayName,
        bio: creator.bio,
        avatarUrl: creator.avatarUrl,
        status: creator.status.value,
        createdAt: creator.createdAt,
        updatedAt: creator.updatedAt,
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get creator by ID',
    description: 'Получить креатора по идентификатору',
  })
  @ApiResponse({
    status: 200,
    description: 'Creator retrieved successfully',
    type: CreatorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Creator not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getCreatorById(@Param('id') id: string) {
    const creator = await this.getCreatorByIdUseCase.execute(id);

    return {
      id: creator.id,
      userId: creator.userId,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      status: creator.status.value,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };
  }

  @Post(':id/social-profiles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add social profile to creator',
    description: 'Добавить социальный профиль к креатору (Instagram, TikTok, YouTube)',
  })
  @ApiResponse({
    status: 201,
    description: 'Social profile added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Creator not found',
  })
  async addSocialProfile(
    @Param('id') creatorId: string,
    @Body() command: AddSocialProfileDto,
  ) {
    await this.addSocialProfileUseCase.execute({
      creatorId,
      ...command,
    });
    return { message: 'Social profile added successfully' };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update creator status',
    description: `
      Обновить статус креатора.
      
      **Важно для активации кампаний:**
      - Для активации кампании (POST /campaigns/{id}/activate) требуется креатор со статусом **'active'**
      - Только креаторы со статусом 'active' могут быть найдены и назначены на кампанию
      - Креаторы со статусом 'pending' или 'suspended' не будут участвовать в поиске для кампаний
      
      **Доступные статусы:**
      - **'active'** - креатор активен и может быть назначен на кампании
      - **'pending'** - креатор ожидает активации (не участвует в кампаниях)
      - **'suspended'** - креатор приостановлен (не участвует в кампаниях)
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Creator ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'pending', 'suspended'],
          description: 'Статус креатора. Для участия в кампаниях требуется "active"',
          example: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: CreatorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Creator not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status value or missing status in request body',
  })
  async updateCreatorStatus(
    @Param('id') creatorId: string,
    @Body() body: { status: 'active' | 'pending' | 'suspended' },
  ) {
    if (!body || !body.status) {
      throw new BadRequestException('Status is required in request body');
    }

    const validStatuses = ['active', 'pending', 'suspended'];
    if (!validStatuses.includes(body.status)) {
      throw new BadRequestException(
        `Invalid status: "${body.status}". Must be one of: ${validStatuses.join(', ')}`
      );
    }

    const creator = await this.updateCreatorStatusUseCase.execute({
      creatorId,
      status: body.status,
    });

    if (!creator) {
      throw new Error('Failed to update creator status - creator is null');
    }

    if (!creator.status) {
      throw new Error('Creator status is missing after update - this should not happen');
    }

    return {
      id: creator.id,
      userId: creator.userId,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      status: creator.status.value,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update creator',
    description: 'Обновить информацию о креаторе (displayName, bio, avatarUrl)',
  })
  @ApiResponse({
    status: 200,
    description: 'Creator updated successfully',
    type: CreatorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Creator not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateCreator(
    @Param('id') creatorId: string,
    @Body() dto: UpdateCreatorDto,
  ) {
    const creator = await this.updateCreatorUseCase.execute({
      creatorId,
      displayName: dto.displayName,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
    });

    return {
      id: creator.id,
      userId: creator.userId,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      status: creator.status.value,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };
  }
}
