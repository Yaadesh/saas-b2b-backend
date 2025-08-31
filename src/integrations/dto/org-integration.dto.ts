import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationDto } from './integration.dto';

export class OrgIntegrationDto {
  @ApiProperty({ description: 'Organization integration ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Organization ID', example: 123 })
  org_id: number;

  @ApiProperty({ description: 'Integration ID', example: 1 })
  integration_id: number;

  @ApiProperty({ description: 'Integration status', example: 1 })
  status: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-08-24T15:55:37.139Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-08-24T15:55:37.139Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Integration details',
    type: IntegrationDto,
  })
  integration?: IntegrationDto;
}
