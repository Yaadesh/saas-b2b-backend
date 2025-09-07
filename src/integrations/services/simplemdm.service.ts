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

export interface SimpleMDMTokenData {
  token: string;
  expires_at: Date;
}

export interface SimpleMDMAuthData {
  apiKey: string;
}

export interface SimpleMDMDeviceInfo {
  id: number;
  name: string;
  serialNumber: string;
  udid: string;
  model: string;
  osVersion: string;
  lastSeen: string;
  user?: {
    email: string;
    name: string;
  };
}

export interface SimpleMDMCommandPayload {
  command_type: string;
  command_parameters?: Record<string, any>;
  device_ids: number[];
}

export interface SimpleMDMCommandResponse {
  id: number;
  command_type: string;
  status: string;
}

@Injectable()
export class SimpleMDMService implements BaseIntegrationService {
  private readonly logger = new Logger(SimpleMDMService.name);
  private readonly baseUrl = 'https://a.simplemdm.com/api/v1';

  constructor(
    private readonly configService: ConfigService,
    private readonly orgIntegrationKeysRepository: OrgIntegrationKeysRepository,
    private readonly integrationRepository: IntegrationRepository,
  ) {}

  /**
   * SimpleMDM doesn't use OAuth, so this method is not applicable
   */
  getAuthorizationUrl(): AuthorizationData {
    throw new BadRequestException('SimpleMDM does not use OAuth flow');
  }

  /**
   * SimpleMDM doesn't use OAuth, so this method is not applicable
   */
  exchangeCodeForToken(): Promise<TokenData> {
    throw new BadRequestException('SimpleMDM does not use OAuth flow');
  }

  /**
   * Store SimpleMDM credentials with encryption and validation
   */
  async storeCredentials(
    orgId: number,
    integrationId: number,
    credentials: Record<string, any>,
  ): Promise<ConnectResponse> {
    const { apiKey } = credentials;

    if (!apiKey) {
      throw new BadRequestException('API Key is required for SimpleMDM');
    }

    try {
      // Test connection
      const connectionTest = await this.testConnection({ apiKey });

      if (!connectionTest.success) {
        return {
          success: false,
          message: connectionTest.message || 'Connection failed',
        };
      }

      // Encrypt and store credentials
      const encryptedData = EncryptionUtil.encryptObject({
        apiKey,
        connectedAt: new Date().toISOString(),
      }, ['apiKey'], this.configService);

      await this.orgIntegrationKeysRepository.storeKeys(
        orgId,
        integrationId,
        encryptedData,
      );

      // Update integration mapping status
      await this.updateIntegrationStatus(orgId, integrationId, 1);

      return {
        success: true,
        message: `Successfully connected to SimpleMDM account`,
        serverInfo: connectionTest.serverInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to store SimpleMDM credentials',
      };
    }
  }

  /**
   * SimpleMDM doesn't use OAuth tokens, but we implement this for interface compliance
   */
  async storeTokens(): Promise<void> {
    throw new BadRequestException('SimpleMDM does not use OAuth tokens');
  }

  /**
   * Get decrypted SimpleMDM credentials
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
      ['apiKey'],
      this.configService,
    );
  }

  /**
   * Test connection to SimpleMDM API
   */
  async testConnection(authData: SimpleMDMAuthData): Promise<{ success: boolean; serverInfo?: any; message?: string }> {
    try {
      // Get account information to verify connection
      const accountInfo = await this.getAccountInfo(authData.apiKey);
      
      return {
        success: true,
        serverInfo: accountInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get SimpleMDM account information
   */
  async getAccountInfo(apiKey: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      return response.data.data;
    } catch (error) {
      this.logger.error('SimpleMDM authentication failed', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new BadRequestException('Invalid API key');
      } else if (error.response?.status === 403) {
        throw new BadRequestException('API key does not have sufficient permissions');
      } else if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException('Cannot connect to SimpleMDM API');
      }
      
      throw new BadRequestException(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get devices managed by SimpleMDM
   */
  async getDevices(apiKey: string, userEmail?: string): Promise<SimpleMDMDeviceInfo[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/devices`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      let devices = response.data.data || [];
      
      // Filter by user email if provided
      if (userEmail) {
        devices = devices.filter((device: any) => 
          device.attributes.user?.email?.toLowerCase() === userEmail.toLowerCase()
        );
      }

      return devices.map((device: any) => ({
        id: device.id,
        name: device.attributes.name || 'Unknown Device',
        serialNumber: device.attributes.serial_number || '',
        udid: device.attributes.udid || '',
        model: device.attributes.model || '',
        osVersion: device.attributes.os_version || '',
        lastSeen: device.attributes.last_seen_at || '',
        user: device.attributes.user,
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
    apiKey: string,
    deviceIds: number[],
    cliTools: string[],
  ): Promise<SimpleMDMCommandResponse> {
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

      const commandPayload = {
        script_body: script,
        script_type: 'bash',
        device_ids: deviceIds,
      };

      const response = await axios.post(
        `${this.baseUrl}/script_jobs`,
        commandPayload,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      this.logger.log(`CLI installation command sent to devices ${deviceIds.join(', ')}`, {
        commandId: response.data.data.id,
        tools: cliTools,
      });

      return {
        id: response.data.data.id,
        command_type: response.data.data.type,
        status: response.data.data.attributes.status,
      };
    } catch (error) {
      this.logger.error('Failed to send CLI installation command', error.response?.data || error.message);
      throw new BadRequestException(`Failed to install CLI tools: ${error.message}`);
    }
  }

  /**
   * Send custom script to device
   */
  async sendScript(
    apiKey: string,
    deviceIds: number[],
    script: string,
    scriptType: 'bash' | 'zsh' = 'bash',
  ): Promise<SimpleMDMCommandResponse> {
    try {
      const commandPayload = {
        script_body: script,
        script_type: scriptType,
        device_ids: deviceIds,
      };

      const response = await axios.post(
        `${this.baseUrl}/script_jobs`,
        commandPayload,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      this.logger.log(`Script command sent to devices ${deviceIds.join(', ')}`, {
        commandId: response.data.data.id,
        scriptType,
      });

      return {
        id: response.data.data.id,
        command_type: response.data.data.type,
        status: response.data.data.attributes.status,
      };
    } catch (error) {
      this.logger.error('Failed to send script command', error.response?.data || error.message);
      throw new BadRequestException(`Failed to send script: ${error.message}`);
    }
  }

  /**
   * Get command status
   */
  async getCommandStatus(apiKey: string, commandId: number): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/script_jobs/${commandId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      return response.data.data;
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