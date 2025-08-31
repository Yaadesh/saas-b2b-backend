import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgIntegrationKeys } from '../entities/org-integration-keys.entity';

@Injectable()
export class OrgIntegrationKeysRepository {
  constructor(
    @InjectRepository(OrgIntegrationKeys)
    private readonly repository: Repository<OrgIntegrationKeys>,
  ) {}

  async findByOrgAndIntegration(
    orgId: number,
    integrationId: number,
    isEnabled?: number,
  ): Promise<OrgIntegrationKeys | null> {
    const whereConditions: any = {
      org_id: orgId,
      integration_id: integrationId,
    };

    if (isEnabled !== undefined) {
      whereConditions.is_enabled = isEnabled;
    }

    return this.repository.findOne({
      where: whereConditions,
    });
  }

  async save(key: Partial<OrgIntegrationKeys>): Promise<OrgIntegrationKeys> {
    if ('org_id' in key && 'integration_id' in key && !('id' in key)) {
      const newKey = this.repository.create(key);
      return this.repository.save(newKey);
    }
    return this.repository.save(key as OrgIntegrationKeys);
  }

  async storeTokens(
    orgId: number,
    integrationId: number,
    tokenData: any,
  ): Promise<OrgIntegrationKeys> {
    const existingKey = await this.findByOrgAndIntegration(
      orgId,
      integrationId,
      1,
    );

    if (existingKey) {
      existingKey.data = { ...existingKey.data, ...tokenData };
      return this.save(existingKey);
    } else {
      return this.save({
        org_id: orgId,
        integration_id: integrationId,
        data: tokenData,
        is_enabled: 1,
      });
    }
  }

  async disable(orgId: number, integrationId: number): Promise<void> {
    await this.repository.update(
      { org_id: orgId, integration_id: integrationId },
      { is_enabled: 0 },
    );
  }

  async getTokens(orgId: number, integrationId: number): Promise<any | null> {
    const key = await this.findByOrgAndIntegration(orgId, integrationId, 1);
    return key?.data || null;
  }
}
