import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { User } from './entities/user.entity';
import { QueryHandlers } from './queries/handlers';
import { CommandHandlers } from './commands/handlers';
import { ScimController } from './scim.controller';
import { ScimService } from './scim.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CqrsModule],
  controllers: [ScimController],
  providers: [ScimService, ...QueryHandlers, ...CommandHandlers],
  exports: [CqrsModule, ScimService],
})
export class UsersModule {}
