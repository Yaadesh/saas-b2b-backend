import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationRepository } from './repositories/integration.repository';
import { OrgIntegrationKeysRepository } from './repositories/org-integration-keys.repository';
import { IntegrationFactoryService } from './services/integration-factory.service';
import { GitHubService } from './services/github.service';
import { SlackService } from './services/slack.service';
import { ConfluenceService } from './services/confluence.service';
import { JamfService } from './services/jamf.service';
import { SimpleMDMService } from './services/simplemdm.service';
import { StateUtil } from './utils/state.util';
import { Integration } from './entities/integration.entity';
import { IntegrationType } from './entities/integration-type.entity';
import { OrgIntegrationKeys } from './entities/org-integration-keys.entity';
import { OrgIntegrationMapping } from './entities/org-integration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Integration,
      IntegrationType,
      OrgIntegrationKeys,
      OrgIntegrationMapping,
    ]),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    IntegrationRepository,
    OrgIntegrationKeysRepository,
    IntegrationFactoryService,
    GitHubService,
    SlackService,
    ConfluenceService,
    JamfService,
    SimpleMDMService,
    StateUtil,
  ],
  exports: [IntegrationsService, ConfluenceService, OrgIntegrationKeysRepository, IntegrationFactoryService],
})
export class IntegrationsModule {}
