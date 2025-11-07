import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type {
  CreateCreatorCommand,
  CreateCreatorUseCase,
} from '../../application/use-cases/create-creator.use-case';

@Controller('creator')
@ApiTags('Creator')
@ApiBearerAuth()
export class CreatorController {
  constructor(private readonly createCreatorUseCase: CreateCreatorUseCase) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new creator' })
  @ApiResponse({ status: 201, description: 'Creator created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async createCreator(@Body() command: CreateCreatorCommand) {
    return this.createCreatorUseCase.execute(command);
  }
}
