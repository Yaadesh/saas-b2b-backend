import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { Integration } from './entities/integration.entity';
import { OrgIntegrationKeys } from './entities/org-integration-keys.entity';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [
    TypeOrmModule.forFeature([Integration, OrgIntegrationKeys]),
    CqrsModule,
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, ...QueryHandlers],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
