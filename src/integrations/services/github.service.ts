import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BaseIntegrationService,
  AuthorizationData,
  TokenData,
} from './base-integration.interface';
import { StateUtil } from '../utils/state.util';

@Injectable()
export class GitHubService implements BaseIntegrationService {
  private readonly appId: string;
  private readonly clientId: string;
  private readonly baseUrl = 'https://github.com';
  private readonly apiUrl = 'https://api.github.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly stateUtil: StateUtil,
  ) {
    this.appId = this.configService.get<string>('GITHUB_APP_ID') || '';
    this.clientId = this.configService.get<string>('GITHUB_CLIENT_ID') || '';
  }

  getAuthorizationUrl(
    orgId: number,
    integrationId: number,
    redirectUri: string,
  ): AuthorizationData {
    const state = this.stateUtil.generateState(orgId, integrationId, 'github');
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
    });

    return {
      authorization_url: `${this.baseUrl}/apps/${this.appId}/installations/new?${params.toString()}`,
      state,
    };
  }

  async exchangeCodeForToken(
    code: string,
    state: string,
    orgId: number,
    redirectUri: string,
  ): Promise<TokenData> {
    this.stateUtil.validateState(state, orgId, undefined, 'github');

    // For GitHub Apps, the 'code' is actually the installation_id
    const installationId = code;

    // Generate JWT for GitHub App authentication
    const jwt = await this.generateAppJWT();

    // Get installation access token
    const response = await fetch(
      `${this.apiUrl}/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub App installation error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      access_token: data.token,
      token_type: 'token',
      expires_at: new Date(data.expires_at),
      // Store installation ID for future reference
      installation_id: installationId,
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/installation/repositories`, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async generateAppJWT(): Promise<string> {
    const { sign } = await import('jsonwebtoken');
    const privateKey =
      this.configService
        .get<string>('GITHUB_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n') || '';

    const payload = {
      iat: Math.floor(Date.now() / 1000) - 60, // Issued at time (1 minute ago to account for clock drift)
      exp: Math.floor(Date.now() / 1000) + 600, // JWT expiration time (10 minutes)
      iss: this.appId, // GitHub App ID
    };

    return sign(payload, privateKey, { algorithm: 'RS256' });
  }
}
