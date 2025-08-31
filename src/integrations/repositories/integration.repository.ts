import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from '../entities/integration.entity';
import { OrgIntegrationMapping } from '../entities/org-integration.entity';

interface IntegrationWithOrgData {
  id: number;
  name: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  meta_data: any;
  org_integration_status?: number | null;
}

@Injectable()
export class IntegrationRepository {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    @InjectRepository(OrgIntegrationMapping)
    private readonly orgIntegrationMappingRepository: Repository<OrgIntegrationMapping>,
  ) {}

  async findIntegrationsByOrgId(
    orgId: number,
  ): Promise<IntegrationWithOrgData[]> {
    const queryBuilder = this.integrationRepository
      .createQueryBuilder('integration')
      .leftJoin(
        'org_integration_mapping',
        'org_mapping',
        'org_mapping.integration_id = integration.id AND org_mapping.org_id = :orgId',
        { orgId },
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

  async findIntegrationByOrgAndId(
    orgId: number,
    integrationId: number,
  ): Promise<IntegrationWithOrgData | null> {
    const integration = await this.integrationRepository.findOne({
      where: {
        id: integrationId,
        is_enabled: true,
      },
    });

    if (!integration) {
      return null;
    }

    const mapping = await this.orgIntegrationMappingRepository.findOne({
      where: {
        org_id: orgId,
        integration_id: integrationId,
      },
    });

    return {
      id: integration.id,
      name: integration.name,
      is_enabled: integration.is_enabled,
      created_at: integration.created_at,
      updated_at: integration.updated_at,
      meta_data: integration.meta_data,
      org_integration_status: mapping?.status || null,
    };
  }

  async findOrgIntegrationMapping(
    orgId: number,
    integrationId: number,
  ): Promise<OrgIntegrationMapping | null> {
    return this.orgIntegrationMappingRepository.findOne({
      where: {
        org_id: orgId,
        integration_id: integrationId,
      },
    });
  }

  async saveOrgIntegrationMapping(
    mapping: Partial<OrgIntegrationMapping>,
  ): Promise<OrgIntegrationMapping> {
    if ('org_id' in mapping && 'integration_id' in mapping) {
      const newMapping = this.orgIntegrationMappingRepository.create(mapping);
      return this.orgIntegrationMappingRepository.save(newMapping);
    }
    return this.orgIntegrationMappingRepository.save(
      mapping as OrgIntegrationMapping,
    );
  }

  async findIntegrationByName(
    integrationName: string,
  ): Promise<Integration | null> {
    return this.integrationRepository.findOne({
      where: {
        name: integrationName.toLowerCase(),
        is_enabled: true,
      },
    });
  }
}
