import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BaseIntegrationService,
  AuthorizationData,
  TokenData,
} from './base-integration.interface';
import { StateUtil } from '../utils/state.util';
import { EncryptionUtil } from '../utils/encryption.util';
import { OrgIntegrationKeysRepository } from '../repositories/org-integration-keys.repository';
import { IntegrationRepository } from '../repositories/integration.repository';

@Injectable()
export class SlackService implements BaseIntegrationService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://slack.com/oauth/v2';
  private readonly apiUrl = 'https://slack.com/api';

  constructor(
    private readonly configService: ConfigService,
    private readonly stateUtil: StateUtil,
    private readonly orgIntegrationKeysRepository: OrgIntegrationKeysRepository,
    private readonly integrationRepository: IntegrationRepository,
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

  /**
   * Store Slack App credentials with encryption
   */
  async storeCredentials(
    orgId: number,
    integrationId: number,
    credentials: { clientId: string; clientSecret: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Encrypt sensitive data
      const encryptedData = EncryptionUtil.encryptObject({
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        connectedAt: new Date().toISOString(),
      }, ['clientSecret'], this.configService);

      // Store encrypted credentials
      await this.orgIntegrationKeysRepository.storeKeys(
        orgId,
        integrationId,
        encryptedData,
      );

      // Update integration mapping status
      await this.updateIntegrationStatus(orgId, integrationId, 1);

      return {
        success: true,
        message: 'Successfully stored Slack credentials',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to store Slack credentials',
      };
    }
  }

  /**
   * Store OAuth tokens with encryption
   */
  async storeTokens(
    orgId: number,
    integrationId: number,
    tokenData: TokenData,
  ): Promise<void> {
    // Encrypt sensitive token data
    const encryptedTokenData = EncryptionUtil.encryptObject(
      tokenData,
      ['access_token', 'refresh_token'],
      this.configService,
    );

    await this.orgIntegrationKeysRepository.storeTokens(
      orgId,
      integrationId,
      encryptedTokenData,
    );

    // Update integration mapping status
    await this.updateIntegrationStatus(orgId, integrationId, 1);
  }

  /**
   * Get decrypted credentials
   */
  async getCredentials(orgId: number, integrationId: number): Promise<any | null> {
    const storedKeys = await this.orgIntegrationKeysRepository.findByOrgAndIntegration(
      orgId,
      integrationId,
      1, // enabled
    );

    if (!storedKeys || !storedKeys.data) {
      return null;
    }

    // Decrypt sensitive fields
    return EncryptionUtil.decryptObject(
      storedKeys.data,
      ['clientSecret', 'access_token', 'refresh_token'],
      this.configService,
    );
  }

  /**
   * Update integration mapping status
   */
  private async updateIntegrationStatus(orgId: number, integrationId: number, status: number): Promise<void> {
    const existingMapping = await this.integrationRepository.findOrgIntegrationMapping(
      orgId,
      integrationId,
    );

    if (existingMapping) {
      existingMapping.status = status;
      await this.integrationRepository.saveOrgIntegrationMapping(existingMapping);
    } else {
      await this.integrationRepository.saveOrgIntegrationMapping({
        org_id: orgId,
        integration_id: integrationId,
        status,
      });
    }
  }
}
