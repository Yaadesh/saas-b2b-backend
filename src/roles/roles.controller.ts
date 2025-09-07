import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignUserToRoleDto,
  AssignModuleToRoleDto,
  RoleIntegrationConfigDto,
} from './dto/role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  private getOrgId(req: any): number {
    const orgId = req.user?.user?.org_id || req.user?.orgId;
    if (!orgId) {
      throw new Error('User org_id not found in request');
    }
    return Number(orgId);
  }

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto, @Request() req) {
    try {
      createRoleDto.org_id = this.getOrgId(req);
      return await this.rolesService.create(createRoleDto);
    } catch (error) {
      if (error.message.includes('already exists in your organization')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  findAll(@Request() req) {
    return this.rolesService.findAll(this.getOrgId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.rolesService.findOne(+id, this.getOrgId(req));
  }

  @Get(':id/with-integrations')
  findRoleWithIntegrations(@Param('id') id: string, @Request() req) {
    return this.rolesService.findRoleWithIntegrations(+id, this.getOrgId(req));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Request() req) {
    try {
      updateRoleDto.org_id = this.getOrgId(req);
      return await this.rolesService.update(+id, this.getOrgId(req), updateRoleDto);
    } catch (error) {
      if (error.message.includes('already exists in your organization')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to update role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.rolesService.remove(+id, this.getOrgId(req));
  }

  @Post('assign-user')
  assignUserToRole(@Body() assignDto: AssignUserToRoleDto, @Request() req) {
    assignDto.org_id = this.getOrgId(req);
    return this.rolesService.assignUserToRole(assignDto);
  }

  @Delete('remove-user/:userId/:roleId')
  removeUserFromRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req,
  ) {
    return this.rolesService.removeUserFromRole(+userId, +roleId, this.getOrgId(req));
  }

  @Post('assign-module')
  assignModuleToRole(@Body() assignDto: AssignModuleToRoleDto, @Request() req) {
    assignDto.org_id = this.getOrgId(req);
    return this.rolesService.assignModuleToRole(assignDto);
  }

  @Delete('remove-module/:roleId/:moduleId')
  removeModuleFromRole(
    @Param('roleId') roleId: string,
    @Param('moduleId') moduleId: string,
    @Request() req,
  ) {
    return this.rolesService.removeModuleFromRole(+roleId, +moduleId, this.getOrgId(req));
  }

  @Post('configure-integration')
  configureRoleIntegration(@Body() configDto: RoleIntegrationConfigDto, @Request() req) {
    configDto.org_id = this.getOrgId(req);
    return this.rolesService.configureRoleIntegration(configDto);
  }

  @Delete('remove-integration/:roleId/:integrationId')
  removeRoleIntegration(
    @Param('roleId') roleId: string,
    @Param('integrationId') integrationId: string,
    @Request() req,
  ) {
    return this.rolesService.removeRoleIntegration(+roleId, +integrationId, this.getOrgId(req));
  }

  @Get(':id/integrations')
  getRoleIntegrations(@Param('id') id: string, @Request() req) {
    return this.rolesService.getRoleIntegrations(+id, this.getOrgId(req));
  }

  @Get(':id/modules')
  getRoleModules(@Param('id') id: string, @Request() req) {
    return this.rolesService.getRoleModules(+id, this.getOrgId(req));
  }

  @Get('user/:userId')
  getUserRoles(@Param('userId') userId: string, @Request() req) {
    return this.rolesService.getUserRoles(+userId, this.getOrgId(req));
  }
}