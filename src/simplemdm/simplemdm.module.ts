import { Module } from '@nestjs/common';
import { SimpleMDMController } from './simplemdm.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [SimpleMDMController],
})
export class SimpleMDMModule {}