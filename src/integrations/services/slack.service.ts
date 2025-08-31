import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BaseIntegrationService,
  AuthorizationData,
  TokenData,
} from './base-integration.interface';
import { StateUtil } from '../utils/state.util';

@Injectable()
export class SlackService implements BaseIntegrationService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://slack.com/oauth/v2';
  private readonly apiUrl = 'https://slack.com/api';

  constructor(
    private readonly configService: ConfigService,
    private readonly stateUtil: StateUtil,
  ) {
    this.clientId = this.configService.get<string>('SLACK_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('SLACK_CLIENT_SECRET') || '';
  }

  getAuthorizationUrl(
    orgId: number,
    integrationId: number,
    redirectUri: string,
  ): AuthorizationData {
    const state = this.stateUtil.generateState(orgId, integrationId, 'slack');
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'channels:read,chat:write,users:read,team:read',
      redirect_uri: redirectUri,
      state,
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
    this.stateUtil.validateState(state, orgId, undefined, 'slack');

    const response = await fetch(`${this.baseUrl}/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack OAuth error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack OAuth error: ${data.error || 'Unknown error'}`);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: 'bearer',
      scope: data.scope,
      expires_at: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenData> {
    const response = await fetch(`${this.baseUrl}/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack token refresh error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(
        `Slack token refresh error: ${data.error || 'Unknown error'}`,
      );
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: 'bearer',
      scope: data.scope,
      expires_at: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/auth.test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      return false;
    }
  }
}
