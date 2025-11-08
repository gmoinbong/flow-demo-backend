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
import {
  RegisterResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  PasswordResetRequestResponseDto,
  VerifyResetTokenResponseDto,
  ResetPasswordResponseDto,
  GetMeResponseDto,
} from '../dto/auth-response.dto';

@Controller('auth')
@ApiTags('Auth')
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
  @ApiOperation({
    summary: 'Register new user',
    description: `
      Регистрация пользователя (creator или brand).
      
      **Creator:** email, password, role='creator', firstName, lastName
      **Brand:** + company, companySize, userRole
      
      Все операции в транзакции.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (validation error)',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: `
      Авторизация по email/password.
      
      **Ответ:** accessToken (15 мин), refreshToken (7 дней), user
      
      Скопировать accessToken → "Authorize" → вставить токен
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts - account temporarily locked',
  })
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);
    // In production, set HttpOnly cookie for refresh token
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Выход и инвалидация refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.logoutUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Получить новый accessToken используя refreshToken',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Запрос токена для сброса пароля (отправка на email)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset token generated and email sent',
    type: PasswordResetRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format',
  })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.requestPasswordResetUseCase.execute(dto);
  }

  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify reset token',
    description: 'Проверка валидности токена сброса пароля',
  })
  @ApiResponse({
    status: 200,
    description: 'Token verification result',
    type: VerifyResetTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    return this.verifyResetTokenUseCase.execute(dto);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Сброс пароля по валидному токену (одноразовый)',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token, or invalid password format',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Получить информацию о текущем пользователе',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: GetMeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getMe(@CurrentUser() user: CurrentUserType) {
    return user;
  }
}


