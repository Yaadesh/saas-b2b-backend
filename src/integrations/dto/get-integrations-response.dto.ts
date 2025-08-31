import { ApiProperty } from '@nestjs/swagger';
import { IntegrationWithOrgDto } from './integration-with-org.dto';

export class GetIntegrationsResponseDto {
  @ApiProperty({
    description:
      'List of all integrations with organization-specific data (LEFT JOIN result)',
    type: [IntegrationWithOrgDto],
    example: [
      {
        id: 1,
        name: 'slack',
        is_enabled: true,
        created_at: '2025-08-24T15:55:37.139Z',
        updated_at: '2025-08-24T15:55:37.139Z',
        meta_data: {
          display_name: 'Slack',
          subtext: 'Team communication and channel management',
        },
        org_integration_status: 1,
      },
      {
        id: 2,
        name: 'github',
        is_enabled: true,
        created_at: '2025-08-24T16:26:09.570Z',
        updated_at: '2025-08-24T16:26:09.570Z',
        meta_data: {
          display_name: 'GitHub',
          subtext: 'Repository access and team management',
        },
        org_integration_status: null,
      },
    ],
  })
  integrations: IntegrationWithOrgDto[];
}
