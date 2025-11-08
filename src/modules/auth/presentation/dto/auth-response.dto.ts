import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User role (creator, brand, admin)',
    example: 'creator',
    enum: ['creator', 'brand', 'admin'],
  })
  role?: string;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Profile unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Profile status',
    example: 'active',
    enum: ['active', 'pending', 'suspended'],
  })
  status: string;
}

export class BrandResponseDto {
  @ApiProperty({
    description: 'Brand unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Brand/company name',
    example: 'Acme Inc.',
  })
  name: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Registered user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Created profile information',
    type: ProfileResponseDto,
  })
  profile: ProfileResponseDto;

  @ApiProperty({
    description: 'Created brand information (only for brand role)',
    type: BrandResponseDto,
    required: false,
  })
  brand?: BrandResponseDto;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'New JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout success message',
    example: 'Logged out successfully',
  })
  message: string;
}

export class PasswordResetRequestResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset email sent',
  })
  message: string;
}

export class VerifyResetTokenResponseDto {
  @ApiProperty({
    description: 'Token validity status',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Token expiration timestamp',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  expiresAt?: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset successfully',
  })
  message: string;
}

export class GetMeResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'User role ID',
    example: 1,
    required: false,
  })
  roleId?: number;
}

