import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RoleIntegrationDto {
  @IsNumber()
  @IsNotEmpty()
  integration_id: number;

  @IsOptional()
  meta_data?: any;
}

export class CreateRoleDto {
  @IsNumber()
  @IsOptional()
  org_id?: number;

  @IsNumber()
  @IsNotEmpty()
  role_type_id: number;

  @IsString()
  @IsOptional()
  team_name?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoleIntegrationDto)
  integrations?: RoleIntegrationDto[];

  @IsArray()
  @IsOptional()
  modules?: number[];
}

export class UpdateRoleDto {
  @IsNumber()
  @IsOptional()
  org_id?: number;

  @IsNumber()
  @IsOptional()
  role_type_id?: number;

  @IsString()
  @IsOptional()
  team_name?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoleIntegrationDto)
  integrations?: RoleIntegrationDto[];

  @IsArray()
  @IsOptional()
  modules?: number[];
}

export class RoleWithIntegrationsDto {
  id: number;
  org_id: number;
  role_type_id: number;
  team_name?: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  integrations?: Array<{
    integration_id: number;
    integration_name: string;
    meta_data: any;
    img_url?: string;
    subtext?: string;
    display_name?: string;
  }>;
}

export class RoleListItemDto {
  id: number;
  org_id: number;
  role_type_id: number;
  team_name?: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  integrations?: Array<{
    integration_id: number;
    integration_name: string;
    meta_data: any;
    img_url?: string;
    subtext?: string;
    display_name?: string;
  }>;
}

export class AssignUserToRoleDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  role_id: number;

  @IsNumber()
  @IsNotEmpty()
  org_id: number;
}

export class AssignModuleToRoleDto {
  @IsNumber()
  @IsNotEmpty()
  role_id: number;

  @IsNumber()
  @IsNotEmpty()
  module_id: number;

  @IsNumber()
  @IsNotEmpty()
  org_id: number;
}

export class RoleIntegrationConfigDto {
  @IsNumber()
  @IsNotEmpty()
  role_id: number;

  @IsNumber()
  @IsNotEmpty()
  integration_id: number;

  @IsNumber()
  @IsNotEmpty()
  org_id: number;

  @IsOptional()
  meta_data?: any;
}