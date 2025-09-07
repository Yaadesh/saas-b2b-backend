import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { EncryptionUtil } from '../utils/encryption.util';
import { 
  BaseIntegrationService, 
  AuthorizationData, 
  TokenData, 
  ConnectResponse 
} from './base-integration.interface';
import { OrgIntegrationKeysRepository } from '../repositories/org-integration-keys.repository';
import { IntegrationRepository } from '../repositories/integration.repository';

export interface JamfTokenData {
  token: string;
  expires_at: Date;
}

export interface JamfAuthData {
  serverUrl: string;
  clientKey: string;
  clientSecret: string;
}

export interface JamfDeviceInfo {
  id: number;
  name: string;
  serialNumber: string;
  udid: string;
  model: string;
  modelDisplayName: string;
  osVersion: string;
  lastContactTime: string;
  userAndLocation?: {
    username: string;
    email: string;
  };
}

export interface JamfCommandPayload {
  command: {
    commandType: string;
    [key: string]: any;
  };
  clientData: Array<{
    managementId: string;
  }>;
}

export interface JamfCommandResponse {
  commandUuid: string;
  requestType: string;
}

@Injectable()
export class JamfService implements BaseIntegrationService {
  private readonly logger = new Logger(JamfService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly orgIntegrationKeysRepository: OrgIntegrationKeysRepository,
    private readonly integrationRepository: IntegrationRepository,
  ) {}

  /**
   * Jamf doesn't use OAuth, so this method is not applicable
   */
  getAuthorizationUrl(): AuthorizationData {
    throw new BadRequestException('Jamf does not use OAuth flow');
  }

  /**
   * Jamf doesn't use OAuth, so this method is not applicable
   */
  exchangeCodeForToken(): Promise<TokenData> {
    throw new BadRequestException('Jamf does not use OAuth flow');
  }

  /**
   * Store Jamf credentials with encryption and validation
   */
  async storeCredentials(
    orgId: number,
    integrationId: number,
    credentials: Record<string, any>,
  ): Promise<ConnectResponse> {
    const { serverUrl, clientKey, clientSecret } = credentials;

    if (!serverUrl || !clientKey || !clientSecret) {
      throw new BadRequestException('serverUrl, clientKey, and clientSecret are required for Jamf');
    }

    if (!serverUrl.startsWith('https://')) {
      throw new BadRequestException('Server URL must use HTTPS');
    }

    try {
      // Test connection
      const connectionTest = await this.testConnection({
        serverUrl,
        clientKey,
        clientSecret,
      });

      if (!connectionTest.success) {
        return {
          success: false,
          message: connectionTest.message || 'Connection failed',
        };
      }

      // Encrypt and store credentials
      const encryptedData = EncryptionUtil.encryptObject({
        serverUrl,
        clientKey,
        clientSecret,
        connectedAt: new Date().toISOString(),
      }, ['clientKey', 'clientSecret'], this.configService);

      await this.orgIntegrationKeysRepository.storeKeys(
        orgId,
        integrationId,
        encryptedData,
      );

      // Update integration mapping status
      await this.updateIntegrationStatus(orgId, integrationId, 1);

      return {
        success: true,
        message: `Successfully connected to ${connectionTest.serverInfo?.name || 'Jamf Pro'}`,
        serverInfo: connectionTest.serverInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to store Jamf credentials',
      };
    }
  }

  /**
   * Jamf doesn't use OAuth tokens, but we implement this for interface compliance
   */
  async storeTokens(): Promise<void> {
    throw new BadRequestException('Jamf does not use OAuth tokens');
  }

  /**
   * Get decrypted Jamf credentials
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
      ['clientKey', 'clientSecret'],
      this.configService,
    );
  }

  /**
   * Authenticate with Jamf Pro using client credentials and return access token
   */
  async authenticate(authData: JamfAuthData): Promise<JamfTokenData> {
    const { serverUrl, clientKey, clientSecret } = authData;

    try {
      // Use OAuth 2.0 Client Credentials flow for Jamf Pro API authentication
      const credentials = Buffer.from(`${clientKey}:${clientSecret}`).toString('base64');
      
      const response: AxiosResponse = await axios.post(
        `${serverUrl}/api/oauth/token`,
        {
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        },
      );

      const { access_token, expires_in } = response.data;
      
      // Calculate expiration date (expires_in is typically in seconds)
      const expiresAt = new Date(Date.now() + (expires_in * 1000));

      return {
        token: access_token,
        expires_at: expiresAt,
      };
    } catch (error) {
      this.logger.error('Jamf authentication failed', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new BadRequestException('Invalid client key or secret');
      } else if (error.response?.status === 404) {
        throw new BadRequestException('Jamf Pro server not found. Check the URL.');
      } else if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException('Cannot connect to Jamf Pro server');
      }
      
      throw new BadRequestException(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Test connection to Jamf Pro server
   */
  async testConnection(authData: JamfAuthData): Promise<{ success: boolean; serverInfo?: any; message?: string }> {
    try {
      const tokenData = await this.authenticate(authData);
      
      // Get Jamf Pro server information to verify connection
      const serverInfo = await this.getJamfProInfo(authData.serverUrl, tokenData.token);
      
      return {
        success: true,
        serverInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get Jamf Pro server information
   */
  private async getJamfProInfo(serverUrl: string, token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${serverUrl}/api/v1/jamf-pro-information`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          timeout: 15000,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.warn('Failed to get Jamf Pro information', error.message);
      return { name: 'Jamf Pro Server' }; // Fallback
    }
  }

  /**
   * Get devices managed by Jamf Pro
   */
  async getDevices(serverUrl: string, token: string, userEmail?: string): Promise<JamfDeviceInfo[]> {
    try {
      let url = `${serverUrl}/api/v1/computers-inventory`;
      const params = new URLSearchParams();
      
      // Filter by user email if provided
      if (userEmail) {
        params.append('filter', `userAndLocation.email=="${userEmail}"`);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      return response.data.results.map((device: any) => ({
        id: device.id,
        name: device.general.name,
        serialNumber: device.general.serialNumber,
        udid: device.general.udid,
        model: device.hardware.model,
        modelDisplayName: device.hardware.modelDisplayName,
        osVersion: device.operatingSystem.version,
        lastContactTime: device.general.lastContactTime,
        userAndLocation: device.userAndLocation,
      }));
    } catch (error) {
      this.logger.error('Failed to get devices', error.response?.data || error.message);
      throw new BadRequestException(`Failed to retrieve devices: ${error.message}`);
    }
  }

  /**
   * Send command to install CLI tools on device
   */
  async installCliTools(
    serverUrl: string,
    token: string,
    deviceId: string,
    cliTools: string[],
  ): Promise<JamfCommandResponse> {
    try {
      // Create installation script for CLI tools using Homebrew
      const brewCommands = cliTools.map(tool => {
        // Handle different tool formats (brew formulas, casks, etc.)
        if (tool.includes('/')) {
          // Tap formula (e.g., "homebrew/cask/docker")
          return `brew install ${tool}`;
        } else if (tool.endsWith('.dmg') || tool.endsWith('.pkg')) {
          // Custom installer - would need more complex handling
          return `echo "Custom installer handling needed for ${tool}"`;
        } else {
          // Standard brew formula
          return `brew install ${tool}`;
        }
      }).join(' && ');

      const script = `#!/bin/bash
# Install CLI tools via Homebrew
set -e

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

# Update Homebrew
brew update

# Install CLI tools
echo "Installing CLI tools: ${cliTools.join(', ')}"
${brewCommands}

echo "✅ CLI tools installation completed successfully"
`;

      const commandPayload: JamfCommandPayload = {
        command: {
          commandType: 'UnixCommand',
          command: script,
        },
        clientData: [
          {
            managementId: deviceId,
          },
        ],
      };

      const response = await axios.post(
        `${serverUrl}/api/v1/computer-commands`,
        commandPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      this.logger.log(`CLI installation command sent to device ${deviceId}`, {
        commandUuid: response.data.commandUuid,
        tools: cliTools,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to send CLI installation command', error.response?.data || error.message);
      throw new BadRequestException(`Failed to install CLI tools: ${error.message}`);
    }
  }

  /**
   * Send custom Unix command to device
   */
  async sendUnixCommand(
    serverUrl: string,
    token: string,
    deviceId: string,
    command: string,
  ): Promise<JamfCommandResponse> {
    try {
      const commandPayload: JamfCommandPayload = {
        command: {
          commandType: 'UnixCommand',
          command: command,
        },
        clientData: [
          {
            managementId: deviceId,
          },
        ],
      };

      const response = await axios.post(
        `${serverUrl}/api/v1/computer-commands`,
        commandPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      this.logger.log(`Unix command sent to device ${deviceId}`, {
        commandUuid: response.data.commandUuid,
        command: command,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to send Unix command', error.response?.data || error.message);
      throw new BadRequestException(`Failed to send command: ${error.message}`);
    }
  }

  /**
   * Get command status
   */
  async getCommandStatus(serverUrl: string, token: string, commandUuid: string): Promise<any> {
    try {
      const response = await axios.get(
        `${serverUrl}/api/v1/computer-commands/${commandUuid}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          timeout: 15000,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get command status', error.response?.data || error.message);
      throw new BadRequestException(`Failed to get command status: ${error.message}`);
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

  /**
   * Encrypt sensitive data for storage
   */
  encrypt(text: string): string {
    return EncryptionUtil.encrypt(text, this.configService);
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    return EncryptionUtil.decrypt(encryptedText, this.configService);
  }
}