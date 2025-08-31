import { ApiProperty } from '@nestjs/swagger';
import { IntegrationWithOrgDto } from './integration-with-org.dto';

export class GetIntegrationResponseDto {
  @ApiProperty({
    description: 'Integration with organization-specific data',
    type: IntegrationWithOrgDto,
  })
  integration: IntegrationWithOrgDto;
}
