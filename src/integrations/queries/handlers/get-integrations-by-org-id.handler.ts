import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetIntegrationsByOrgIdQuery } from '../get-integrations-by-org-id.query';
import { Integration } from '../../entities/integration.entity';

export interface IntegrationWithOrgData {
  id: number;
  name: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  meta_data: any;
  org_integration_status?: number;
}

@QueryHandler(GetIntegrationsByOrgIdQuery)
export class GetIntegrationsByOrgIdHandler
  implements IQueryHandler<GetIntegrationsByOrgIdQuery>
{
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
  ) {}

  async execute(
    query: GetIntegrationsByOrgIdQuery,
  ): Promise<IntegrationWithOrgData[]> {
    const queryBuilder = this.integrationRepository
      .createQueryBuilder('integration')
      .leftJoin(
        'org_integration_mapping',
        'org_mapping',
        'org_mapping.integration_id = integration.id AND org_mapping.org_id = :orgId',
        { orgId: query.orgId },
      )
      .select([
        'integration.id as id',
        'integration.name as name',
        'integration.is_enabled as is_enabled',
        'integration.created_at as created_at',
        'integration.updated_at as updated_at',
        'integration.meta_data as meta_data',
        'org_mapping.status as org_integration_status',
      ])
      .where('integration.is_enabled = :enabled', { enabled: true })
      .orderBy('integration.created_at', 'ASC');

    return queryBuilder.getRawMany();
  }
}
