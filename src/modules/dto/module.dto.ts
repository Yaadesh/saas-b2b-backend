import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfluenceDocument, CustomTask, ModuleContent } from '../entities/module.entity';

export class GenericDocumentDto {
  @ApiProperty({ description: 'Document URL', example: 'https://example.com/doc' })
  @IsString()
  url: string;
}

export class GenericTaskDto {
  @ApiProperty({ description: 'Task text/description', example: 'Complete this task' })
  @IsString()
  text: string;
}

export class ConfluenceDocumentDto {
  @ApiProperty({ description: 'Confluence document ID', example: '123456' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Document title', example: 'API Security Guidelines' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Document URL', example: 'https://company.atlassian.net/wiki/spaces/DEV/pages/123456/API+Security+Guidelines' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Space key', example: 'DEV' })
  @IsString()
  spaceKey: string;

  @ApiProperty({ description: 'Space name', example: 'Development' })
  @IsString()
  spaceName: string;
}

export class CustomTaskDto {
  @ApiProperty({ description: 'Task ID', example: 'task-1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Task description', example: 'Complete security training' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Task completion status', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class ModuleContentDto {
  @ApiProperty({ 
    description: 'Confluence documents', 
    type: [ConfluenceDocumentDto], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfluenceDocumentDto)
  confluenceDocuments?: ConfluenceDocumentDto[];

  @ApiProperty({ 
    description: 'Custom tasks', 
    type: [CustomTaskDto], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomTaskDto)
  customTasks?: CustomTaskDto[];
}

export class CreateModuleDto {
  @ApiProperty({ description: 'Module name', example: 'Backend Onboarding' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Documents', type: [GenericDocumentDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenericDocumentDto)
  docs?: GenericDocumentDto[];

  @ApiProperty({ description: 'Tasks', type: [GenericTaskDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenericTaskDto)
  tasks?: GenericTaskDto[];
}

export class UpdateModuleDto {
  @ApiProperty({ description: 'Module name', example: 'Backend Onboarding', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Module content', type: ModuleContentDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ModuleContentDto)
  content?: ModuleContentDto;

  @ApiProperty({ description: 'Documents', type: [GenericDocumentDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenericDocumentDto)
  docs?: GenericDocumentDto[];

  @ApiProperty({ description: 'Tasks', type: [GenericTaskDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenericTaskDto)
  tasks?: GenericTaskDto[];

  @ApiProperty({ description: 'Module active status (1=active, 0=inactive)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  is_active?: number;
}

export class ModuleResponseDto {
  @ApiProperty({ description: 'Module ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Organization ID', example: 1 })
  org_id: number;

  @ApiProperty({ description: 'Module name', example: 'Backend Onboarding' })
  name: string;

  @ApiProperty({ description: 'Module content', type: ModuleContentDto })
  content: ModuleContentDto;

  @ApiProperty({ description: 'Module active status (1=active, 0=inactive)', example: 1 })
  is_active: number;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: 'Update timestamp', example: '2024-01-01T00:00:00Z' })
  updated_at: Date;
}

export class GetModulesResponseDto {
  @ApiProperty({ description: 'List of modules', type: [ModuleResponseDto] })
  modules: ModuleResponseDto[];

  @ApiProperty({ description: 'Total count', example: 10 })
  total: number;
}

export class ConfluenceSearchResponseDto {
  @ApiProperty({ description: 'Search results', type: [ConfluenceDocumentDto] })
  results: ConfluenceDocumentDto[];

  @ApiProperty({ description: 'Total results found', example: 25 })
  total: number;
}