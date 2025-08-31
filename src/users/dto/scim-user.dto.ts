import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScimNameDto {
  @ApiPropertyOptional({ description: 'Formatted full name' })
  formatted?: string;

  @ApiPropertyOptional({ description: 'Family name' })
  familyName?: string;

  @ApiPropertyOptional({ description: 'Given name' })
  givenName?: string;

  @ApiPropertyOptional({ description: 'Middle name' })
  middleName?: string;

  @ApiPropertyOptional({ description: 'Honorific prefix' })
  honorificPrefix?: string;

  @ApiPropertyOptional({ description: 'Honorific suffix' })
  honorificSuffix?: string;
}

export class ScimEmailDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  value: string;

  @ApiPropertyOptional({ description: 'Email type', example: 'work' })
  type?: string;

  @ApiPropertyOptional({
    description: 'Primary email indicator',
    example: true,
  })
  primary?: boolean;
}

export class ScimMetaDto {
  @ApiProperty({ description: 'Resource type', example: 'User' })
  resourceType: string;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2025-08-24T15:55:37.139Z',
  })
  created?: string;

  @ApiPropertyOptional({
    description: 'Last modified timestamp',
    example: '2025-08-24T15:55:37.139Z',
  })
  lastModified?: string;

  @ApiPropertyOptional({
    description: 'Resource location',
    example: '/scim/v2/Users/123',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Resource version',
    example: 'W/"123456789"',
  })
  version?: string;
}

export class ScimUserDto {
  @ApiProperty({
    description: 'SCIM schemas',
    example: ['urn:ietf:params:scim:schemas:core:2.0:User'],
  })
  schemas: string[];

  @ApiProperty({ description: 'User ID', example: '123' })
  id: string;

  @ApiProperty({ description: 'Username (email)', example: 'user@example.com' })
  userName: string;

  @ApiPropertyOptional({ description: 'User name details', type: ScimNameDto })
  name?: ScimNameDto;

  @ApiPropertyOptional({ description: 'Display name', example: 'John Doe' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Email addresses', type: [ScimEmailDto] })
  emails?: ScimEmailDto[];

  @ApiProperty({ description: 'User active status', example: true })
  active: boolean;

  @ApiProperty({ description: 'Resource metadata', type: ScimMetaDto })
  meta: ScimMetaDto;
}

export class ScimUsersResponseDto {
  @ApiProperty({
    description: 'SCIM response schemas',
    example: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
  })
  schemas: string[];

  @ApiProperty({ description: 'Total number of results', example: 100 })
  totalResults: number;

  @ApiProperty({ description: 'Starting index (1-based)', example: 1 })
  startIndex: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  itemsPerPage: number;

  @ApiProperty({ description: 'User resources', type: [ScimUserDto] })
  Resources: ScimUserDto[];
}
