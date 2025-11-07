import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { VerifyResetTokenUseCase } from '../../application/use-cases/verify-reset-token.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import {
  RequestPasswordResetDto,
  VerifyResetTokenDto,
  ResetPasswordDto,
} from '../dto/reset-password.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly verifyResetTokenUseCase: VerifyResetTokenUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);
    // In production, set HttpOnly cookie for refresh token
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.logoutUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset token generated' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.requestPasswordResetUseCase.execute(dto);
  }

  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify reset token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    return this.verifyResetTokenUseCase.execute(dto);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  async getMe(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}


