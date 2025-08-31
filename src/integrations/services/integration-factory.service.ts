import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseIntegrationService } from './base-integration.interface';
import { GitHubService } from './github.service';
import { SlackService } from './slack.service';
import { ConfluenceService } from './confluence.service';

export enum IntegrationType {
  GITHUB = 'github',
  SLACK = 'slack',
  CONFLUENCE = 'confluence',
}

@Injectable()
export class IntegrationFactoryService {
  constructor(
    private readonly githubService: GitHubService,
    private readonly slackService: SlackService,
    private readonly confluenceService: ConfluenceService,
  ) {}

  getIntegrationService(integrationName: string): BaseIntegrationService {
    switch (integrationName.toLowerCase()) {
      case IntegrationType.GITHUB:
        return this.githubService;
      case IntegrationType.SLACK:
        return this.slackService;
      case IntegrationType.CONFLUENCE:
        return this.confluenceService;
      default:
        throw new BadRequestException(
          `Unsupported integration: ${integrationName}`,
        );
    }
  }

  getSupportedIntegrations(): string[] {
    return Object.values(IntegrationType);
  }
}
