import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ModuleRepository } from './repositories/module.repository';
import { ConfluenceSearchService } from './services/confluence-search.service';
import { 
  CreateModuleDto, 
  UpdateModuleDto, 
  ModuleResponseDto, 
  GetModulesResponseDto,
  ConfluenceSearchResponseDto 
} from './dto/module.dto';
import { Module } from './entities/module.entity';

@Injectable()
export class ModulesService {
  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly confluenceSearchService: ConfluenceSearchService,
  ) {}

  /**
   * Create a new learning module
   */
  async createModule(
    orgId: number,
    userId: number,
    createModuleDto: CreateModuleDto,
  ): Promise<ModuleResponseDto> {
    // Validate module content
    this.validateModuleContent(createModuleDto);

    const module = await this.moduleRepository.create(orgId, userId, createModuleDto);
    return this.toModuleResponseDto(module);
  }

  /**
   * Get all modules for an organization
   */
  async getModules(
    orgId: number,
    includeInactive = false,
  ): Promise<GetModulesResponseDto> {
    const modules = await this.moduleRepository.findByOrgId(orgId, includeInactive);
    const total = await this.moduleRepository.countByOrgId(orgId, includeInactive);

    return {
      modules: modules.map(module => this.toModuleResponseDto(module)),
      total,
    };
  }

  /**
   * Get a specific module by ID
   */
  async getModuleById(
    id: number,
    orgId: number,
  ): Promise<ModuleResponseDto> {
    const module = await this.moduleRepository.findByIdAndOrgId(id, orgId);
    
    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    return this.toModuleResponseDto(module);
  }

  /**
   * Update an existing module
   */
  async updateModule(
    id: number,
    orgId: number,
    updateModuleDto: UpdateModuleDto,
  ): Promise<ModuleResponseDto> {
    const existingModule = await this.moduleRepository.findByIdAndOrgId(id, orgId);
    
    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    // Validate content if provided
    if (updateModuleDto.content || (updateModuleDto as any).docs || (updateModuleDto as any).tasks) {
      this.validateModuleContent(updateModuleDto as CreateModuleDto);
    }

    const updatedModule = await this.moduleRepository.update(id, updateModuleDto);
    
    if (!updatedModule) {
      throw new BadRequestException('Failed to update module');
    }

    return this.toModuleResponseDto(updatedModule);
  }

  /**
   * Delete a module (soft delete)
   */
  async deleteModule(id: number, orgId: number): Promise<void> {
    const existingModule = await this.moduleRepository.findByIdAndOrgId(id, orgId);
    
    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    await this.moduleRepository.softDelete(id);
  }

  /**
   * Search modules by name or description
   */
  async searchModules(
    orgId: number,
    searchTerm: string,
  ): Promise<GetModulesResponseDto> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters long');
    }

    const modules = await this.moduleRepository.search(orgId, searchTerm.trim());

    return {
      modules: modules.map(module => this.toModuleResponseDto(module)),
      total: modules.length,
    };
  }

  /**
   * Search Confluence documents
   */
  async searchConfluenceDocuments(
    orgId: number,
    integrationId: number,
    searchTerm: string,
    limit = 10,
  ): Promise<ConfluenceSearchResponseDto> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters long');
    }

    const searchResults = await this.confluenceSearchService.searchDocuments(
      orgId,
      integrationId,
      searchTerm.trim(),
      limit,
    );

    return {
      results: searchResults.results,
      total: searchResults.total,
    };
  }

  /**
   * Get recent Confluence documents
   */
  async getRecentConfluenceDocuments(
    orgId: number,
    integrationId: number,
    limit = 10,
  ): Promise<ConfluenceSearchResponseDto> {
    const recentResults = await this.confluenceSearchService.getRecentDocuments(
      orgId,
      integrationId,
      limit,
    );

    return {
      results: recentResults.results,
      total: recentResults.total,
    };
  }

  /**
   * Get Confluence spaces
   */
  async getConfluenceSpaces(
    orgId: number,
    integrationId: number,
    limit = 25,
  ) {
    return this.confluenceSearchService.getSpaces(orgId, integrationId, limit);
  }

  /**
   * Validate module content structure
   */
  private validateModuleContent(moduleData: CreateModuleDto): void {
    // Handle both old content format and new generic format
    let docs = (moduleData as any).docs;
    let tasks = (moduleData as any).tasks;
    
    if ((moduleData as any).content) {
      // Legacy format with content wrapper
      const { content } = moduleData as any;
      docs = content.confluenceDocuments;
      tasks = content.customTasks;
    }

    if ((!docs || docs.length === 0) && (!tasks || tasks.length === 0)) {
      throw new BadRequestException('Module must have at least one document or task');
    }

    // Validate documents
    if (docs) {
      for (const doc of docs) {
        if (!doc.url) {
          throw new BadRequestException('Each document must have a url');
        }
      }
    }

    // Validate tasks
    if (tasks) {
      for (const task of tasks) {
        if (!task.text && !task.description) {
          throw new BadRequestException('Each task must have text or description');
        }
      }
    }
  }

  /**
   * Convert Module entity to response DTO
   */
  private toModuleResponseDto(module: Module): ModuleResponseDto {
    return {
      id: module.id,
      org_id: module.org_id,
      name: module.name,
      content: module.content,
      is_active: module.is_active,
      created_at: module.created_at,
      updated_at: module.updated_at,
    };
  }
}