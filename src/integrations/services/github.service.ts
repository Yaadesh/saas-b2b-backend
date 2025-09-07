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
export class GitHubService implements BaseIntegrationService {
  private readonly appId: string;
  private readonly clientId: string;
  private readonly baseUrl = 'https://github.com';
  private readonly apiUrl = 'https://api.github.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly stateUtil: StateUtil,
    private readonly orgIntegrationKeysRepository: OrgIntegrationKeysRepository,
    private readonly integrationRepository: IntegrationRepository,
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

  /**
   * Store GitHub App credentials with encryption
   */
  async storeCredentials(
    orgId: number,
    integrationId: number,
    credentials: { appId: string; clientId: string; privateKey: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate credentials first
      await this.testCredentials(credentials.appId, credentials.privateKey);

      // Encrypt sensitive data
      const encryptedData = EncryptionUtil.encryptObject({
        appId: credentials.appId,
        clientId: credentials.clientId,
        privateKey: credentials.privateKey,
        connectedAt: new Date().toISOString(),
      }, ['privateKey'], this.configService);

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
        message: 'Successfully connected to GitHub App',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to store GitHub credentials',
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
      ['privateKey', 'access_token', 'refresh_token'],
      this.configService,
    );
  }

  /**
   * Test GitHub App credentials
   */
  private async testCredentials(appId: string, privateKey: string): Promise<void> {
    try {
      const { sign } = await import('jsonwebtoken');
      const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
      
      const payload = {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 600,
        iss: appId,
      };

      sign(payload, cleanPrivateKey, { algorithm: 'RS256' });
    } catch (error) {
      throw new Error(`Invalid GitHub App credentials: ${error.message}`);
    }
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
