import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { IntegrationFactoryService } from '../integrations/services/integration-factory.service';

interface JamfConnectDto {
  integrationId: number;
  serverUrl: string;
  clientKey: string;
  clientSecret: string;
}

@ApiTags('jamf')
@Controller('jamf')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class JamfController {
  constructor(
    private readonly integrationFactoryService: IntegrationFactoryService,
  ) {}

  @Post('connect')
  @ApiOperation({
    summary: 'Connect to Jamf Pro',
    description: 'Connects to Jamf Pro using server URL, client key, and client secret',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully connected to Jamf Pro',
  })
  async connectJamf(
    @Request() req: AuthenticatedRequest,
    @Body() body: JamfConnectDto,
  ) {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    if (!body.integrationId || !body.serverUrl || !body.clientKey || !body.clientSecret) {
      throw new BadRequestException('All fields are required: integrationId, serverUrl, clientKey, clientSecret');
    }

    try {
      const credentials = {
        serverUrl: body.serverUrl,
        clientKey: body.clientKey,
        clientSecret: body.clientSecret,
      };

      return await this.integrationFactoryService.connectWithCredentials(
        'jamf',
        orgId,
        body.integrationId,
        credentials,
      );
    } catch (error) {
      throw new BadRequestException(`Failed to connect to Jamf: ${error.message}`);
    }
  }
}