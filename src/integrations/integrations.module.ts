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
import { StateUtil } from './utils/state.util';
import { Integration } from './entities/integration.entity';
import { OrgIntegrationKeys } from './entities/org-integration-keys.entity';
import { OrgIntegrationMapping } from './entities/org-integration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Integration,
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
    StateUtil,
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
