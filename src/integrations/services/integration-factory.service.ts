import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseIntegrationService, ConnectResponse } from './base-integration.interface';
import { GitHubService } from './github.service';
import { SlackService } from './slack.service';
import { ConfluenceService } from './confluence.service';
import { JamfService } from './jamf.service';
import { SimpleMDMService } from './simplemdm.service';

export enum IntegrationType {
  GITHUB = 'github',
  SLACK = 'slack',
  CONFLUENCE = 'confluence',
  JAMF = 'jamf',
  SIMPLEMDM = 'simplemdm',
}

@Injectable()
export class IntegrationFactoryService {
  constructor(
    private readonly githubService: GitHubService,
    private readonly slackService: SlackService,
    private readonly confluenceService: ConfluenceService,
    private readonly jamfService: JamfService,
    private readonly simpleMdmService: SimpleMDMService,
  ) {}

  getIntegrationService(integrationName: string): BaseIntegrationService {
    switch (integrationName.toLowerCase()) {
      case IntegrationType.GITHUB:
        return this.githubService;
      case IntegrationType.SLACK:
        return this.slackService;
      case IntegrationType.CONFLUENCE:
        return this.confluenceService;
      case IntegrationType.JAMF:
        return this.jamfService;
      case IntegrationType.SIMPLEMDM:
        return this.simpleMdmService;
      default:
        throw new BadRequestException(
          `Unsupported integration: ${integrationName}`,
        );
    }
  }

  getSupportedIntegrations(): string[] {
    return Object.values(IntegrationType);
  }

  /**
   * Handle credential-based connection
   */
  async connectWithCredentials(
    integrationName: string,
    orgId: number,
    integrationId: number,
    credentials: Record<string, any>,
  ): Promise<ConnectResponse> {
    const service = this.getIntegrationService(integrationName);
    
    if (!service.storeCredentials) {
      throw new BadRequestException(
        `Credential-based connection not supported for ${integrationName}`,
      );
    }

    return service.storeCredentials(orgId, integrationId, credentials);
  }

  /**
   * Handle OAuth callback and token storage
   */
  async handleCallback(
    integrationName: string,
    orgId: number,
    integrationId: number,
    code: string,
    state: string,
    redirectUri: string,
  ): Promise<void> {
    const service = this.getIntegrationService(integrationName);
    
    const tokenData = await service.exchangeCodeForToken(
      code,
      state,
      orgId,
      redirectUri,
    );

    await service.storeTokens(orgId, integrationId, tokenData);
  }
}
