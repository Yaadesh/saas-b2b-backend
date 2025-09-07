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
import { IntegrationFactoryService } from '../integrations/services/integration-factory.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    orgId: number | null;
    payload: any;
    user: any;
  };
}

interface SimpleMDMConnectDto {
  integrationId: number;
  apiKey: string;
}

@ApiTags('simplemdm')
@Controller('simplemdm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SimpleMDMController {
  constructor(
    private readonly integrationFactoryService: IntegrationFactoryService,
  ) {}

  @Post('connect')
  @ApiOperation({
    summary: 'Connect to SimpleMDM',
    description: 'Connects to SimpleMDM using API key',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully connected to SimpleMDM',
  })
  async connectSimpleMDM(
    @Request() req: AuthenticatedRequest,
    @Body() body: SimpleMDMConnectDto,
  ) {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    if (!body.integrationId || !body.apiKey) {
      throw new BadRequestException('Both integrationId and apiKey are required');
    }

    try {
      const credentials = {
        apiKey: body.apiKey,
      };

      return await this.integrationFactoryService.connectWithCredentials(
        'simplemdm',
        orgId,
        body.integrationId,
        credentials,
      );
    } catch (error) {
      throw new BadRequestException(`Failed to connect to SimpleMDM: ${error.message}`);
    }
  }
}