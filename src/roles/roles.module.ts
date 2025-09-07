import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role } from './entities/role.entity';
import { RoleIntegrationMapping } from './entities/role-integration-mapping.entity';
import { UserRoleMapping } from './entities/user-role-mapping.entity';
import { RoleModuleMapping } from './entities/role-module-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      RoleIntegrationMapping,
      UserRoleMapping,
      RoleModuleMapping,
    ]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}