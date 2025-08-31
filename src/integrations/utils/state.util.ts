import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface StatePayload {
  org_id: number;
  integration_id?: number;
  integration_name?: string;
  timestamp: number;
}

@Injectable()
export class StateUtil {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateState(
    orgId: number,
    integrationId?: number,
    integrationName?: string,
  ): string {
    const payload: StatePayload = {
      org_id: orgId,
      integration_id: integrationId,
      integration_name: integrationName,
      timestamp: Date.now(),
    };

    return this.jwtService.sign(payload, {
      secret: this.getStateSecret(),
      expiresIn: '1h', // State expires in 1 hour
    });
  }

  validateState(
    state: string,
    expectedOrgId: number,
    expectedIntegrationId?: number,
    expectedIntegrationName?: string,
  ): StatePayload {
    try {
      const payload = this.jwtService.verify(state, {
        secret: this.getStateSecret(),
      });

      if (payload.org_id !== expectedOrgId) {
        throw new Error('Organization ID mismatch in state');
      }

      if (
        expectedIntegrationId &&
        payload.integration_id !== expectedIntegrationId
      ) {
        throw new Error('Integration ID mismatch in state');
      }

      if (
        expectedIntegrationName &&
        payload.integration_name !== expectedIntegrationName
      ) {
        throw new Error('Integration name mismatch in state');
      }

      return payload;
    } catch (error) {
      throw new Error(`Invalid state parameter: ${error.message}`);
    }
  }

  private getStateSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET_INTERNAL') ||
      'default-state-secret'
    );
  }
}
