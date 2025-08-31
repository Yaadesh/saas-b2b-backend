import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GetIntegrationsByOrgIdQuery } from './queries/get-integrations-by-org-id.query';
import { GetIntegrationsResponseDto } from './dto/get-integrations-response.dto';
import { OrgIntegrationKeys } from './entities/org-integration-keys.entity';
import { GenerateHeaderTokenResponseDto } from './dto/generate-header-token.dto';
import { HEADER_TOKEN_EXPIRES_IN, HEADER_TOKEN_TYPE } from '../constants';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly queryBus: QueryBus,
    @InjectRepository(OrgIntegrationKeys)
    private readonly orgIntegrationKeysRepository: Repository<OrgIntegrationKeys>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async findIntegrationsByOrgId(
    orgId: number,
  ): Promise<GetIntegrationsResponseDto> {
    const integrations = await this.queryBus.execute(
      new GetIntegrationsByOrgIdQuery(orgId),
    );

    return {
      integrations,
    };
  }

  async generateHeaderToken(
    orgId: number,
    integrationId: number,
  ): Promise<GenerateHeaderTokenResponseDto> {
    const existingKey = await this.orgIntegrationKeysRepository.findOne({
      where: {
        org_id: orgId,
        integration_id: integrationId,
        is_enabled: 1,
      },
    });

    if (existingKey && existingKey.data?.header_token) {
      try {
        this.jwtService.verify(existingKey.data.header_token, {
          secret: this.configService.get<string>('JWT_SECRET_INTERNAL') || 'default-secret',
        });
        
        return {
          header_token: existingKey.data.header_token,
        };
      } catch (error) {
        existingKey.is_enabled = 0;
        await this.orgIntegrationKeysRepository.save(existingKey);
      }
    }

    const createdAt = new Date();
    const jwtPayload = {
      org_id: orgId,
      integration_id: integrationId,
      created_at: createdAt.toISOString(),
      type: HEADER_TOKEN_TYPE,
    };

    const headerToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_SECRET_INTERNAL') || 'default-secret',
      expiresIn: HEADER_TOKEN_EXPIRES_IN,
    });

    const keyData = {
      header_token: headerToken,
    };

    const newKey = this.orgIntegrationKeysRepository.create({
      org_id: orgId,
      integration_id: integrationId,
      data: keyData,
      is_enabled: 1,
    });
    await this.orgIntegrationKeysRepository.save(newKey);

    return {
      header_token: headerToken,
    };
  }
}
