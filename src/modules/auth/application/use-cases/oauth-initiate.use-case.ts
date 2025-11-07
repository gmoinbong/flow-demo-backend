import { UseCase } from 'src/shared/core/application/use-cases/base';
import { OAuthProviderService } from '../services/oauth-provider.service';
import { OAuthProvider } from '../../domain/entities/oauth-account.entity';
import { OAuthStateService } from '../services/oauth-state.service';
import { randomBytes } from 'crypto';

export interface OAuthInitiateInput {
  provider: OAuthProvider;
  redirectUri: string;
}

export interface OAuthInitiateOutput {
  authorizationUrl: string;
  state: string;
}

/**
 * OAuth initiate use case - generate authorization URL
 */
export class OAuthInitiateUseCase
  implements UseCase<OAuthInitiateInput, OAuthInitiateOutput>
{
  constructor(
    private readonly oauthProviderService: OAuthProviderService,
    private readonly oauthStateService: OAuthStateService,
  ) {}

  async execute(input: OAuthInitiateInput): Promise<OAuthInitiateOutput> {
    const provider = this.oauthProviderService.getProvider(input.provider);

    // Generate state token for CSRF protection
    const state = randomBytes(32).toString('hex');
    const signedState = this.oauthStateService.signState(state);

    // Get authorization URL with signed state
    const authorizationUrl = provider.getAuthorizationUrl(
      signedState,
      input.redirectUri,
    );

    return {
      authorizationUrl,
      state: signedState,
    };
  }
}


