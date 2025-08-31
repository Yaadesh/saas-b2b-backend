import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScimNameDto {
  @ApiPropertyOptional({
    description: 'Formatted full name',
    example: 'John Doe',
  })
  formatted?: string;

  @ApiPropertyOptional({ description: 'Family name', example: 'Doe' })
  familyName?: string;

  @ApiPropertyOptional({ description: 'Given name', example: 'John' })
  givenName?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'M' })
  middleName?: string;
}

export class CreateScimEmailDto {
  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  value: string;

  @ApiPropertyOptional({ description: 'Email type', example: 'work' })
  type?: string;

  @ApiPropertyOptional({
    description: 'Primary email indicator',
    example: true,
  })
  primary?: boolean;
}

export class CreateScimUserDto {
  @ApiProperty({
    description: 'SCIM schemas for user creation',
    example: ['urn:ietf:params:scim:schemas:core:2.0:User'],
  })
  schemas: string[];

  @ApiProperty({
    description: 'Username (email)',
    example: 'john.doe@example.com',
  })
  userName: string;

  @ApiPropertyOptional({
    description: 'User name details',
    type: CreateScimNameDto,
  })
  name?: CreateScimNameDto;

  @ApiPropertyOptional({ description: 'Display name', example: 'John Doe' })
  displayName?: string;

  @ApiProperty({ description: 'Email addresses', type: [CreateScimEmailDto] })
  emails: CreateScimEmailDto[];

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
    default: true,
  })
  active?: boolean;
}
