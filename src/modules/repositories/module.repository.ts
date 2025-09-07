import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from '../entities/module.entity';
import { CreateModuleDto, UpdateModuleDto } from '../dto/module.dto';

@Injectable()
export class ModuleRepository {
  constructor(
    @InjectRepository(Module)
    private readonly repository: Repository<Module>,
  ) {}

  async create(orgId: number, userId: number, createModuleDto: CreateModuleDto): Promise<Module> {
    // Transform generic format to database format
    const content = this.transformToModuleContent(createModuleDto);
    
    const moduleData = {
      org_id: orgId,
      name: createModuleDto.name,
      content: content,
    };
    
    const module = this.repository.create(moduleData);
    return this.repository.save(module);
  }

  private transformToModuleContent(data: CreateModuleDto | any): any {
    const result: any = {};

    // Handle generic docs format
    if ((data as any).docs && Array.isArray((data as any).docs)) {
      result.confluenceDocuments = (data as any).docs.map((doc: any, index: number) => ({
        id: `doc-${index + 1}`,
        title: `Document ${index + 1}`,
        url: doc.url,
        spaceKey: 'GENERIC',
        spaceName: 'Generic Documents'
      }));
    }

    // Handle generic tasks format
    if ((data as any).tasks && Array.isArray((data as any).tasks)) {
      result.customTasks = (data as any).tasks.map((task: any, index: number) => ({
        id: `task-${index + 1}`,
        description: task.text || task.description || 'Task',
        completed: false
      }));
    }

    // Handle legacy content format (for backwards compatibility)
    if (data.content) {
      return data.content;
    }

    return result;
  }

  async findByOrgId(orgId: number, includeInactive = false): Promise<Module[]> {
    const queryBuilder = this.repository.createQueryBuilder('module')
      .where('module.org_id = :orgId', { orgId });

    if (!includeInactive) {
      queryBuilder.andWhere('module.is_active = :isActive', { isActive: 1 });
    }

    return queryBuilder
      .orderBy('module.created_at', 'DESC')
      .getMany();
  }

  async findById(id: number): Promise<Module | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByIdAndOrgId(id: number, orgId: number): Promise<Module | null> {
    return this.repository.findOne({
      where: { id, org_id: orgId },
    });
  }

  async update(id: number, updateModuleDto: UpdateModuleDto): Promise<Module | null> {
    // Transform update data if it contains docs/tasks
    const updateData = { ...updateModuleDto };
    
    if ((updateModuleDto as any).docs || (updateModuleDto as any).tasks) {
      const transformedContent = this.transformToModuleContent(updateModuleDto);
      updateData.content = transformedContent;
      
      // Remove the generic fields after transformation
      delete (updateData as any).docs;
      delete (updateData as any).tasks;
    }
    
    await this.repository.update({ id }, updateData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete({ id });
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.update({ id }, { is_active: 0 });
  }

  async search(orgId: number, searchTerm: string): Promise<Module[]> {
    return this.repository
      .createQueryBuilder('module')
      .where('module.org_id = :orgId', { orgId })
      .andWhere('module.is_active = :isActive', { isActive: 1 })
      .andWhere(
        'LOWER(module.name) LIKE LOWER(:searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('module.created_at', 'DESC')
      .getMany();
  }

  async countByOrgId(orgId: number, includeInactive = false): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('module')
      .where('module.org_id = :orgId', { orgId });

    if (!includeInactive) {
      queryBuilder.andWhere('module.is_active = :isActive', { isActive: 1 });
    }

    return queryBuilder.getCount();
  }
}