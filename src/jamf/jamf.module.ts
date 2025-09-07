import { Module } from '@nestjs/common';
import { JamfController } from './jamf.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [JamfController],
})
export class JamfModule {}