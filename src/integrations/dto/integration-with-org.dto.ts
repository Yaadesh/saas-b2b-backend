import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IntegrationWithOrgDto {
  @ApiProperty({ description: 'Integration ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Integration name', example: 'slack' })
  name: string;

  @ApiProperty({
    description: 'Whether the integration is enabled',
    example: true,
  })
  is_enabled: boolean;

  @ApiProperty({
    description: 'Integration creation timestamp',
    example: '2025-08-24T15:55:37.139Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Integration last update timestamp',
    example: '2025-08-24T15:55:37.139Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Integration metadata',
    example: {
      display_name: 'Slack',
      subtext: 'Team communication and channel management',
      extra: 'OAuth 2.0, Bot API, Channel sync',
    },
  })
  meta_data?: {
    display_name?: string;
    subtext?: string;
    extra?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Organization integration status (null if not configured)',
    example: 1,
  })
  org_integration_status?: number;
}
