import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Organization } from './entities/organization.entity';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [TypeOrmModule.forFeature([Organization]), CqrsModule],
  providers: [...QueryHandlers],
  exports: [CqrsModule],
})
export class OrganizationsModule {}
