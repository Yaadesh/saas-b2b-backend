import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { User } from './entities/user.entity';
import { QueryHandlers } from './queries/handlers';
import { CommandHandlers } from './commands/handlers';
import { ScimController } from './scim.controller';
import { ScimService } from './scim.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CqrsModule],
  controllers: [ScimController, UsersController],
  providers: [ScimService, UsersService, ...QueryHandlers, ...CommandHandlers],
  exports: [CqrsModule, ScimService, UsersService],
})
export class UsersModule {}
