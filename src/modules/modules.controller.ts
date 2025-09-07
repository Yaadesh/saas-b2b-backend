import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModulesService } from './modules.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  ModuleResponseDto,
  GetModulesResponseDto,
  ConfluenceSearchResponseDto,
} from './dto/module.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('modules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  private getOrgId(req: any): number {
    const orgId = req.user?.user?.org_id || req.user?.orgId;
    if (!orgId) {
      throw new Error('User org_id not found in request');
    }
    return Number(orgId);
  }

  private getUserId(req: any): number {
    const userId = req.user?.user?.id || req.user?.id;
    if (!userId) {
      throw new Error('User id not found in request');
    }
    return Number(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new learning module' })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid module data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createModule(
    @Body() createModuleDto: CreateModuleDto,
    @Request() req,
  ): Promise<ModuleResponseDto> {
    const orgId = this.getOrgId(req);
    const userId = this.getUserId(req);
    return this.modulesService.createModule(
      orgId,
      userId,
      createModuleDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all learning modules for organization' })
  @ApiResponse({
    status: 200,
    description: 'Modules retrieved successfully',
    type: GetModulesResponseDto,
  })
  async getModules(
    @Request() req,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<GetModulesResponseDto> {
    return this.modulesService.getModules(this.getOrgId(req), includeInactive);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search learning modules by name or description' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: GetModulesResponseDto,
  })
  async searchModules(
    @Request() req,
    @Query('q') searchTerm: string,
  ): Promise<GetModulesResponseDto> {
    return this.modulesService.searchModules(this.getOrgId(req), searchTerm);
  }

  @Get('docs/search')
  @ApiOperation({ summary: 'Search documents for autofill' })
  @ApiResponse({
    status: 200,
    description: 'Document search results retrieved successfully',
    type: ConfluenceSearchResponseDto,
  })
  async searchDocuments(
    @Request() req,
    @Query('integrationId', ParseIntPipe) integrationId: number,
    @Query('q') searchTerm: string,
    @Query('limit') limit?: number,
  ): Promise<ConfluenceSearchResponseDto> {
    return this.modulesService.searchConfluenceDocuments(
      this.getOrgId(req),
      integrationId,
      searchTerm,
      limit,
    );
  }

  @Get('docs/recent')
  @ApiOperation({ summary: 'Get recent documents' })
  @ApiResponse({
    status: 200,
    description: 'Recent documents retrieved successfully',
    type: ConfluenceSearchResponseDto,
  })
  async getRecentDocuments(
    @Request() req,
    @Query('integrationId', ParseIntPipe) integrationId: number,
    @Query('limit') limit?: number,
  ): Promise<ConfluenceSearchResponseDto> {
    return this.modulesService.getRecentConfluenceDocuments(
      this.getOrgId(req),
      integrationId,
      limit,
    );
  }

  @Get('docs/spaces')
  @ApiOperation({ summary: 'Get document spaces' })
  @ApiResponse({
    status: 200,
    description: 'Document spaces retrieved successfully',
  })
  async getDocumentSpaces(
    @Request() req,
    @Query('integrationId', ParseIntPipe) integrationId: number,
    @Query('limit') limit?: number,
  ) {
    return this.modulesService.getConfluenceSpaces(
      this.getOrgId(req),
      integrationId,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific learning module by ID' })
  @ApiResponse({
    status: 200,
    description: 'Module retrieved successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModuleById(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ModuleResponseDto> {
    return this.modulesService.getModuleById(id, this.getOrgId(req));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing learning module' })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  async updateModule(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuleDto: UpdateModuleDto,
  ): Promise<ModuleResponseDto> {
    return this.modulesService.updateModule(id, this.getOrgId(req), updateModuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a learning module (soft delete)' })
  @ApiResponse({ status: 200, description: 'Module deleted successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async deleteModule(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.modulesService.deleteModule(id, this.getOrgId(req));
  }
}