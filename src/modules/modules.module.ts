import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { ModuleRepository } from './repositories/module.repository';
import { ConfluenceSearchService } from './services/confluence-search.service';
import { Module as ModuleEntity } from './entities/module.entity';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity]),
    IntegrationsModule,
  ],
  controllers: [ModulesController],
  providers: [
    ModulesService,
    ModuleRepository,
    ConfluenceSearchService,
  ],
  exports: [ModulesService],
})
export class ModulesModule {}