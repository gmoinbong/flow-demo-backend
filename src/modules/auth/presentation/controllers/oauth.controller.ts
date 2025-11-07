import {
  Controller,
  Get,
  Query,
  Res,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OAuthInitiateUseCase } from '../../application/use-cases/oauth-initiate.use-case';
import { OAuthCallbackUseCase } from '../../application/use-cases/oauth-callback.use-case';
import type { OAuthProvider } from '../../domain/entities/oauth-account.entity';
import { OAuthCallbackResponseDto } from '../dto/oauth-callback.dto';
import { OAuthUrlResponseDto } from '../dto/oauth-url.dto';

@ApiTags('oauth')
@Controller('auth/oauth')
export class OAuthController {
  constructor(
    private readonly oauthInitiateUseCase: OAuthInitiateUseCase,
    private readonly oauthCallbackUseCase: OAuthCallbackUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Get(':provider/initiate')
  @ApiOperation({
    summary: 'Initiate OAuth flow (server redirect)',
    description: `**OAuth Flow Step 1: Server-Side Redirect**

Initiates the OAuth 2.0 authorization flow with server-side redirect. This endpoint:
1. Generates a secure state token for CSRF protection
2. Builds the authorization URL with required parameters
3. Redirects the user to the OAuth provider (Google/TikTok/Instagram)

**Use this endpoint for:**
- Direct browser navigation (user clicks a link)
- Server-side redirects
- Testing in Swagger UI

**How to use:**
- Navigate to \`/auth/oauth/{provider}/initiate\`
- Optionally specify \`redirect_uri\` query parameter (defaults to \`http://localhost:3000/auth/oauth/{provider}/callback\`)
- User will be redirected to the OAuth provider's login page

**Important:** After authorization, the provider redirects back to your callback URL with an authorization code.

**Flow:**
\`\`\`
Client → GET /auth/oauth/{provider}/initiate 
      → Redirect to OAuth Provider
      → User authorizes
      → Redirect to /auth/oauth/{provider}/callback?code=...&state=...
\`\`\``,
  })
  @ApiParam({
    name: 'provider',
    enum: ['google', 'tiktok', 'instagram'],
    description:
      'OAuth provider name. Available values: google, tiktok, instagram',
    example: 'google',
  })
  @ApiQuery({
    name: 'redirect_uri',
    required: false,
    allowEmptyValue: true,
    description:
      'Callback URL where OAuth provider will redirect after authorization. Must match the URI configured in OAuth provider settings. If not provided, defaults to: http://localhost:3000/auth/oauth/{provider}/callback',
    example: 'http://localhost:3000/auth/oauth/google/callback',
  })
  @ApiResponse({
    status: 302,
    description:
      'Redirects to OAuth provider authorization page. User will be asked to authorize the application.',
  })
  async initiate(
    @Param('provider') provider: OAuthProvider,
    @Query('redirect_uri') redirectUri: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.oauthInitiateUseCase.execute({
      provider,
      redirectUri:
        redirectUri || `http://localhost:3000/auth/oauth/${provider}/callback`,
    });

    res.redirect(result.authorizationUrl);
  }

  @Get(':provider/url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get OAuth authorization URL',
    description: `**Get OAuth URL for Frontend**

Returns the OAuth authorization URL as JSON. Use this endpoint when you need to get the URL on the frontend and handle the redirect client-side.

**Response:**
- \`authorizationUrl\`: Full URL to redirect user to OAuth provider
- \`state\`: CSRF protection token (store this for verification in callback)

**Frontend usage:**
\`\`\`javascript
const response = await fetch('/auth/oauth/google/url?redirect_uri=http://localhost:3000/auth/oauth/google/callback');
const { authorizationUrl } = await response.json();
window.location.href = authorizationUrl;
\`\`\``,
  })
  @ApiParam({
    name: 'provider',
    enum: ['google', 'tiktok', 'instagram'],
    description:
      'OAuth provider name. Available values: google, tiktok, instagram',
    example: 'google',
  })
  @ApiQuery({
    name: 'redirect_uri',
    required: false,
    allowEmptyValue: true,
    description:
      'Callback URL where OAuth provider will redirect after authorization. Must match the URI configured in OAuth provider settings. If not provided, defaults to: http://localhost:3000/auth/oauth/callback',
    example: 'http://localhost:3000/auth/oauth/google/callback',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns OAuth authorization URL and state token',
    type: OAuthUrlResponseDto,
  })
  async getAuthorizationUrl(
    @Param('provider') provider: OAuthProvider,
    @Query('redirect_uri') redirectUri: string | undefined,
  ): Promise<OAuthUrlResponseDto> {
    const result = await this.oauthInitiateUseCase.execute({
      provider,
      redirectUri:
        redirectUri || `http://localhost:3000/auth/oauth/${provider}/callback`,
    });

    return {
      authorizationUrl: result.authorizationUrl,
      state: result.state,
    };
  }

  @Get(':provider/authorize')
  @ApiOperation({
    summary: 'Initiate OAuth flow (server redirect)',
    description: `**OAuth Flow Step 1: Server-Side Redirect**

Initiates the OAuth 2.0 authorization flow with server-side redirect. This endpoint:
1. Generates a secure state token for CSRF protection
2. Builds the authorization URL with required parameters
3. Redirects the user to the OAuth provider (Google/TikTok/Instagram)

**Use this endpoint for:**
- Direct browser navigation (user clicks a link)
- Server-side redirects
- Testing in Swagger UI

**Use \`/auth/oauth/{provider}/url\` instead for:**
- Frontend applications that need to get the URL as JSON
- Client-side redirect handling

**How to use in Swagger:**
- Click "Try it out"
- Select provider: \`google\`, \`tiktok\`, or \`instagram\`
- Optionally specify \`redirect_uri\` (defaults to \`http://localhost:3000/auth/oauth/callback\`)
- Click "Execute" - this will redirect you to the OAuth provider's login page

**Important:** After authorization, the provider redirects back to your callback URL with an authorization code.

**Flow:**
\`\`\`
Client → GET /auth/oauth/{provider}/authorize 
      → Redirect to OAuth Provider
      → User authorizes
      → Redirect to /auth/oauth/{provider}/callback?code=...&state=...
\`\`\``,
  })
  @ApiParam({
    name: 'provider',
    enum: ['google', 'tiktok', 'instagram'],
    description:
      'OAuth provider name. Available values: google, tiktok, instagram',
    example: 'google',
  })
  @ApiQuery({
    name: 'redirect_uri',
    required: false,
    allowEmptyValue: true,
    description:
      'Callback URL where OAuth provider will redirect after authorization. Must match the URI configured in OAuth provider settings. If not provided, defaults to: http://localhost:3000/auth/oauth/callback',
    example: 'http://localhost:3000/auth/oauth/google/callback',
  })
  @ApiResponse({
    status: 302,
    description:
      'Redirects to OAuth provider authorization page. User will be asked to authorize the application.',
  })
  async authorize(
    @Param('provider') provider: OAuthProvider,
    @Query('redirect_uri') redirectUri: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.oauthInitiateUseCase.execute({
      provider,
      redirectUri:
        redirectUri || `http://localhost:3000/auth/oauth/${provider}/callback`,
    });

    // Store state in session/cookie for verification (in production, use secure session)
    // State is already included in authorizationUrl by the provider
    res.redirect(result.authorizationUrl);
  }

  @Get(':provider/callback')
  @ApiOperation({
    summary: 'OAuth callback handler',
    description: `**OAuth Flow Step 2: Callback Handler**

This endpoint is called by the OAuth provider after user authorization. It:
1. Validates the authorization code and state parameter
2. Exchanges the code for access/refresh tokens
3. Retrieves user profile data from the provider
4. Creates or links the OAuth account to an existing user
5. Generates JWT tokens (access + refresh) for your application
6. Redirects to frontend with tokens

**How it works:**
- Called automatically by OAuth provider after user authorization
- Receives \`code\` (authorization code) and \`state\` (CSRF token) as query parameters
- Redirects to frontend URL with tokens in hash fragment

**Redirect format:**
\`{FRONTEND_URL}/auth/callback#access_token={token}&refresh_token={token}&user={userData}\`

**Note:** This endpoint is typically called by the OAuth provider, not directly by Swagger.`,
  })
  @ApiParam({
    name: 'provider',
    enum: ['google', 'tiktok', 'instagram'],
    description: 'OAuth provider name',
    example: 'google',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description:
      'Authorization code received from OAuth provider after user authorization',
    example: '4/0AeanR0...',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    description:
      'State token for CSRF protection. Must match the state sent in the authorization request.',
    example: '4ff0130bbe39db64430b3d6e0dc1572f30d7309c3a007e46d88ffadc1278903f',
  })
  @ApiQuery({
    name: 'redirect_uri',
    required: false,
    description:
      'Callback URL. Must match the redirect_uri used in the authorization request.',
    example: 'http://localhost:3000/auth/oauth/google/callback',
  })
  @ApiQuery({
    name: 'frontend_redirect_uri',
    required: false,
    description:
      'Frontend URL to redirect after successful authentication. If not provided, uses FRONTEND_URL env variable or defaults to http://localhost:3001',
    example: 'http://localhost:3001/auth/callback',
  })
  @ApiResponse({
    status: 302,
    description:
      'Redirects to frontend with tokens in URL hash fragment after successful authentication',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OAuth response (invalid code, state mismatch, etc.)',
  })
  async callback(
    @Param('provider') provider: OAuthProvider,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('redirect_uri') redirectUri: string | undefined,
    @Query('frontend_redirect_uri') frontendRedirectUri: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.oauthCallbackUseCase.execute({
      provider,
      code,
      state,
      redirectUri:
        redirectUri || `http://localhost:3000/auth/oauth/${provider}/callback`,
    });

    // Get frontend URL from query param, env variable, or default
    const frontendUrl =
      frontendRedirectUri ||
      this.configService.get<string>('FRONTEND_URL')

    // Build redirect URL with tokens in hash fragment (more secure than query params)
    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.hash = `access_token=${result.accessToken}&refresh_token=${result.refreshToken}&user=${encodeURIComponent(JSON.stringify(result.user))}&isNewUser=${result.isNewUser}`;

    res.redirect(redirectUrl.toString());
  }
}
