import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleIntegrationMapping } from './entities/role-integration-mapping.entity';
import { UserRoleMapping } from './entities/user-role-mapping.entity';
import { RoleModuleMapping } from './entities/role-module-mapping.entity';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleWithIntegrationsDto,
  RoleListItemDto,
  AssignUserToRoleDto,
  AssignModuleToRoleDto,
  RoleIntegrationConfigDto,
} from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RoleIntegrationMapping)
    private roleIntegrationRepository: Repository<RoleIntegrationMapping>,
    @InjectRepository(UserRoleMapping)
    private userRoleRepository: Repository<UserRoleMapping>,
    @InjectRepository(RoleModuleMapping)
    private roleModuleRepository: Repository<RoleModuleMapping>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { integrations, modules, ...roleData } = createRoleDto;
    
    try {
      // Create the role first
      const role = this.roleRepository.create(roleData);
      const savedRole = await this.roleRepository.save(role);
      
      // Configure integrations if provided
      if (integrations && integrations.length > 0) {
        for (const integration of integrations) {
          const mapping = this.roleIntegrationRepository.create({
            role_id: savedRole.id,
            integration_id: integration.integration_id,
            org_id: savedRole.org_id,
            meta_data: integration.meta_data || {},
          });
          await this.roleIntegrationRepository.save(mapping);
        }
      }

      // Configure modules if provided
      if (modules && modules.length > 0) {
        for (const moduleId of modules) {
          const mapping = this.roleModuleRepository.create({
            role_id: savedRole.id,
            module_id: moduleId,
            org_id: savedRole.org_id,
          });
          await this.roleModuleRepository.save(mapping);
        }
      }
      
      return savedRole;
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'unique_role_title_per_org') {
        throw new Error(`A role with the title "${createRoleDto.title}" already exists in your organization. Please choose a different title.`);
      }
      throw error;
    }
  }

  async findAll(orgId: number): Promise<RoleListItemDto[]> {
    const roles = await this.roleRepository.find({
      where: { org_id: orgId },
      order: { created_at: 'DESC' },
    });

    const rolesWithIntegrations = await Promise.all(
      roles.map(async (role) => {
        const integrationMappings = await this.roleIntegrationRepository
          .createQueryBuilder('rim')
          .leftJoinAndSelect('rim.integration', 'integration')
          .where('rim.role_id = :roleId AND rim.org_id = :orgId', { 
            roleId: role.id, 
            orgId 
          })
          .getMany();

        return {
          ...role,
          integrations: integrationMappings.map(mapping => ({
            integration_id: mapping.integration_id,
            integration_name: mapping.integration.name,
            meta_data: mapping.meta_data,
            img_url: mapping.integration.meta_data?.img_url,
            subtext: mapping.integration.meta_data?.subtext,
            display_name: mapping.integration.meta_data?.display_name,
          })),
        };
      })
    );

    return rolesWithIntegrations;
  }

  async findOne(id: number, orgId: number): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { id, org_id: orgId },
    });
  }

  async findRoleWithIntegrations(id: number, orgId: number): Promise<RoleWithIntegrationsDto> {
    const role = await this.roleRepository.findOne({
      where: { id, org_id: orgId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const integrations = await this.roleIntegrationRepository
      .createQueryBuilder('rim')
      .leftJoinAndSelect('rim.integration', 'integration')
      .where('rim.role_id = :roleId AND rim.org_id = :orgId', { roleId: id, orgId })
      .getMany();

    return {
      ...role,
      integrations: integrations.map(mapping => ({
        integration_id: mapping.integration_id,
        integration_name: mapping.integration.name,
        meta_data: mapping.meta_data,
      })),
    };
  }

  async update(id: number, orgId: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    await this.roleRepository.update({ id, org_id: orgId }, updateRoleDto);
    const role = await this.findOne(id, orgId);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  async updateWithIntegrations(id: number, orgId: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { integrations, modules, ...roleData } = updateRoleDto;
    
    try {
      // Update the role first
      await this.roleRepository.update({ id, org_id: orgId }, roleData);
      const role = await this.findOne(id, orgId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Handle integrations if provided
      if (integrations !== undefined) {
        // Remove all existing integrations for this role
        await this.roleIntegrationRepository.delete({
          role_id: id,
          org_id: orgId,
        });

        // Add new integrations
        if (integrations && integrations.length > 0) {
          for (const integration of integrations) {
            const mapping = this.roleIntegrationRepository.create({
              role_id: id,
              integration_id: integration.integration_id,
              org_id: orgId,
              meta_data: integration.meta_data || {},
            });
            await this.roleIntegrationRepository.save(mapping);
          }
        }
      }

      // Handle modules if provided
      if (modules !== undefined) {
        // Remove all existing modules for this role
        await this.roleModuleRepository.delete({
          role_id: id,
          org_id: orgId,
        });

        // Add new modules
        if (modules && modules.length > 0) {
          for (const moduleId of modules) {
            const mapping = this.roleModuleRepository.create({
              role_id: id,
              module_id: moduleId,
              org_id: orgId,
            });
            await this.roleModuleRepository.save(mapping);
          }
        }
      }
      
      return role;
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'unique_role_title_per_org') {
        throw new Error(`A role with the title "${updateRoleDto.title}" already exists in your organization. Please choose a different title.`);
      }
      throw error;
    }
  }

  async remove(id: number, orgId: number): Promise<void> {
    await this.roleRepository.delete({ id, org_id: orgId });
  }

  async assignUserToRole(assignDto: AssignUserToRoleDto): Promise<UserRoleMapping> {
    const existingMapping = await this.userRoleRepository.findOne({
      where: {
        user_id: assignDto.user_id,
        role_id: assignDto.role_id,
        org_id: assignDto.org_id,
      },
    });

    if (existingMapping) {
      existingMapping.status = 1;
      return await this.userRoleRepository.save(existingMapping);
    }

    const mapping = this.userRoleRepository.create({
      ...assignDto,
      status: 1,
    });
    return await this.userRoleRepository.save(mapping);
  }

  async removeUserFromRole(userId: number, roleId: number, orgId: number): Promise<void> {
    await this.userRoleRepository.update(
      { user_id: userId, role_id: roleId, org_id: orgId },
      { status: 0 }
    );
  }

  async assignModuleToRole(assignDto: AssignModuleToRoleDto): Promise<RoleModuleMapping> {
    const existingMapping = await this.roleModuleRepository.findOne({
      where: {
        role_id: assignDto.role_id,
        module_id: assignDto.module_id,
        org_id: assignDto.org_id,
      },
    });

    if (existingMapping) {
      return existingMapping;
    }

    const mapping = this.roleModuleRepository.create(assignDto);
    return await this.roleModuleRepository.save(mapping);
  }

  async removeModuleFromRole(roleId: number, moduleId: number, orgId: number): Promise<void> {
    await this.roleModuleRepository.delete({
      role_id: roleId,
      module_id: moduleId,
      org_id: orgId,
    });
  }

  async configureRoleIntegration(configDto: RoleIntegrationConfigDto): Promise<RoleIntegrationMapping> {
    const existingMapping = await this.roleIntegrationRepository.findOne({
      where: {
        role_id: configDto.role_id,
        integration_id: configDto.integration_id,
        org_id: configDto.org_id,
      },
    });

    if (existingMapping) {
      existingMapping.meta_data = configDto.meta_data;
      return await this.roleIntegrationRepository.save(existingMapping);
    }

    const mapping = this.roleIntegrationRepository.create(configDto);
    return await this.roleIntegrationRepository.save(mapping);
  }

  async removeRoleIntegration(roleId: number, integrationId: number, orgId: number): Promise<void> {
    await this.roleIntegrationRepository.delete({
      role_id: roleId,
      integration_id: integrationId,
      org_id: orgId,
    });
  }

  async getRoleIntegrations(roleId: number, orgId: number): Promise<RoleIntegrationMapping[]> {
    return await this.roleIntegrationRepository.find({
      where: { role_id: roleId, org_id: orgId },
      relations: ['integration'],
    });
  }

  async getRoleModules(roleId: number, orgId: number): Promise<RoleModuleMapping[]> {
    return await this.roleModuleRepository.find({
      where: { role_id: roleId, org_id: orgId },
      relations: ['module'],
    });
  }

  async getUserRoles(userId: number, orgId: number): Promise<UserRoleMapping[]> {
    return await this.userRoleRepository.find({
      where: { user_id: userId, org_id: orgId, status: 1 },
      relations: ['role'],
    });
  }
}