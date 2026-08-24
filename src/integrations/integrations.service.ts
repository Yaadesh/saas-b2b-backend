import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GetIntegrationsResponseDto } from './dto/get-integrations-response.dto';
import { GetIntegrationResponseDto } from './dto/get-integration-response.dto';
import { GenerateHeaderTokenResponseDto } from './dto/generate-header-token.dto';
import {
  ConnectIntegrationRequestDto,
  ConnectIntegrationResponseDto,
  CallbackRequestDto,
  CallbackResponseDto,
} from './dto/connect-integration.dto';
import { IntegrationRepository } from './repositories/integration.repository';
import { OrgIntegrationKeysRepository } from './repositories/org-integration-keys.repository';
import { IntegrationFactoryService } from './services/integration-factory.service';
import { OrgIntegrationKeys } from './entities/org-integration-keys.entity';
import { OrgIntegrationMapping } from './entities/org-integration.entity';
import { HEADER_TOKEN_EXPIRES_IN, HEADER_TOKEN_TYPE } from '../constants';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly integrationRepository: IntegrationRepository,
    private readonly orgIntegrationKeysRepository: OrgIntegrationKeysRepository,
    private readonly integrationFactoryService: IntegrationFactoryService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private getInternalJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET_INTERNAL');
    if (!secret) {
      throw new Error('JWT_SECRET_INTERNAL is required');
    }
    return secret;
  }

  async findIntegrationsByOrgId(
    orgId: number,
    integrationType?: number,
  ): Promise<GetIntegrationsResponseDto> {
    const integrations =
      await this.integrationRepository.findIntegrationsByOrgId(orgId, integrationType);

    return {
      integrations,
    };
  }

  async findIntegrationByOrgAndId(
    orgId: number,
    integrationId: number,
  ): Promise<GetIntegrationResponseDto> {
    const integration =
      await this.integrationRepository.findIntegrationByOrgAndId(
        orgId,
        integrationId,
      );

    if (!integration) {
      throw new NotFoundException(
        `Integration with ID ${integrationId} not found`,
      );
    }

    return {
      integration,
    };
  }

  async generateHeaderToken(
    orgId: number,
    integrationId: number,
  ): Promise<GenerateHeaderTokenResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const existingKey =
        await this.orgIntegrationKeysRepository.findByOrgAndIntegration(
          orgId,
          integrationId,
          1,
        );

      if (existingKey && existingKey.data?.header_token) {
        try {
          this.jwtService.verify(existingKey.data.header_token, {
            secret: this.getInternalJwtSecret(),
          });

          return {
            header_token: existingKey.data.header_token,
          };
        } catch (error) {
          existingKey.is_enabled = 0;
          await manager.save(OrgIntegrationKeys, existingKey);
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
        secret: this.getInternalJwtSecret(),
        expiresIn: HEADER_TOKEN_EXPIRES_IN,
      });

      const keyData = {
        header_token: headerToken,
      };

      const newKey = manager.create(OrgIntegrationKeys, {
        org_id: orgId,
        integration_id: integrationId,
        data: keyData,
        is_enabled: 1,
      });
      await manager.save(OrgIntegrationKeys, newKey);

      const existingMapping =
        await this.integrationRepository.findOrgIntegrationMapping(
          orgId,
          integrationId,
        );

      if (existingMapping) {
        existingMapping.status = 1;
        await manager.save(OrgIntegrationMapping, existingMapping);
      } else {
        const newMapping = manager.create(OrgIntegrationMapping, {
          org_id: orgId,
          integration_id: integrationId,
          status: 1,
        });
        await manager.save(OrgIntegrationMapping, newMapping);
      }

      return {
        header_token: headerToken,
      };
    });
  }

  async connectIntegration(
    orgId: number,
    integrationId: number,
  ): Promise<ConnectIntegrationResponseDto> {
    const integration =
      await this.integrationRepository.findIntegrationByOrgAndId(
        orgId,
        integrationId,
      );

    if (!integration) {
      throw new NotFoundException(
        `Integration with ID ${integrationId} not found`,
      );
    }

    const integrationService =
      this.integrationFactoryService.getIntegrationService(integration.name);

    const redirectUri = `${this.configService.get<string>('APP_BASE_URL')}/integrations/callback`;

    return integrationService.getAuthorizationUrl(
      orgId,
      integrationId,
      redirectUri,
    );
  }

  async handleCallback(
    orgId: number,
    callbackData: CallbackRequestDto,
  ): Promise<CallbackResponseDto> {
    const integration =
      await this.integrationRepository.findIntegrationByOrgAndId(
        orgId,
        callbackData.integration_id,
      );

    if (!integration) {
      throw new NotFoundException(
        `Integration with ID ${callbackData.integration_id} not found`,
      );
    }

    const redirectUri = `${this.configService.get<string>('APP_BASE_URL')}/integrations/callback`;

    try {
      // Use factory service to handle the entire callback flow
      await this.integrationFactoryService.handleCallback(
        integration.name,
        orgId,
        callbackData.integration_id,
        callbackData.code,
        callbackData.state,
        redirectUri,
      );

      return {
        message: 'Integration connected successfully',
        status: 'connected',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to connect integration: ${error.message}`,
      );
    }
  }
}
