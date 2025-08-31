import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BaseIntegrationService,
  AuthorizationData,
  TokenData,
} from './base-integration.interface';
import { StateUtil } from '../utils/state.util';

@Injectable()
export class ConfluenceService implements BaseIntegrationService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://auth.atlassian.com';
  private readonly apiUrl = 'https://api.atlassian.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly stateUtil: StateUtil,
  ) {
    this.clientId =
      this.configService.get<string>('CONFLUENCE_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('CONFLUENCE_CLIENT_SECRET') || '';
  }

  getAuthorizationUrl(
    orgId: number,
    integrationId: number,
    redirectUri: string,
  ): AuthorizationData {
    const state = this.stateUtil.generateState(
      orgId,
      integrationId,
      'confluence',
    );
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: this.clientId,
      scope:
        'read:confluence-content.summary read:confluence-space.summary read:confluence-user offline_access',
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
      prompt: 'consent',
    });

    return {
      authorization_url: `${this.baseUrl}/authorize?${params.toString()}`,
      state,
    };
  }

  async exchangeCodeForToken(
    code: string,
    state: string,
    orgId: number,
    redirectUri: string,
  ): Promise<TokenData> {
    this.stateUtil.validateState(state, orgId, undefined, 'confluence');

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Confluence OAuth error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Confluence OAuth error: ${data.error_description || data.error}`,
      );
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'Bearer',
      scope: data.scope,
      expires_at: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Confluence token refresh error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Confluence token refresh error: ${data.error_description || data.error}`,
      );
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'Bearer',
      scope: data.scope,
      expires_at: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiUrl}/oauth/token/accessible-resources`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        },
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
