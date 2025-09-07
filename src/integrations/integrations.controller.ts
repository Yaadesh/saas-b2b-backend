import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { GetIntegrationsResponseDto } from './dto/get-integrations-response.dto';
import { GetIntegrationResponseDto } from './dto/get-integration-response.dto';
import {
  GenerateHeaderTokenRequestDto,
  GenerateHeaderTokenResponseDto,
} from './dto/generate-header-token.dto';
import {
  ConnectIntegrationRequestDto,
  ConnectIntegrationResponseDto,
  CallbackRequestDto,
  CallbackResponseDto,
} from './dto/connect-integration.dto';
import { IntegrationFactoryService } from './services/integration-factory.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    orgId: number | null;
    payload: any;
    user: any;
  };
}

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly integrationFactoryService: IntegrationFactoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get integrations for organization',
    description:
      "Retrieves all available integrations and organization-specific integration status. Requires authentication and automatically filters by user's organization. Optional integration_type query parameter to filter by type (1=functional, 2=app).",
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved integrations',
    type: GetIntegrationsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized - Invalid or missing JWT token, or organization ID not found',
  })
  async getIntegrations(
    @Request() req: AuthenticatedRequest,
    @Query('integration_type') integrationType?: number,
  ): Promise<GetIntegrationsResponseDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    return this.integrationsService.findIntegrationsByOrgId(orgId, integrationType);
  }

  @Get(':integration_id')
  @ApiOperation({
    summary: 'Get single integration by ID for organization',
    description:
      'Retrieves a specific integration with organization-specific data. Returns the same format as GET /integrations but for a single integration.',
  })
  @ApiParam({
    name: 'integration_id',
    type: 'number',
    description: 'The ID of the integration to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved integration',
    type: GetIntegrationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized - Invalid or missing JWT token, or organization ID not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Integration not found',
  })
  async getIntegrationById(
    @Request() req: AuthenticatedRequest,
    @Param('integration_id', ParseIntPipe) integrationId: number,
  ): Promise<GetIntegrationResponseDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    return this.integrationsService.findIntegrationByOrgAndId(
      orgId,
      integrationId,
    );
  }

  @Post('generate-header-token')
  @ApiOperation({
    summary: 'Generate header token for organization integration',
    description:
      'Generates or retrieves existing header token for the specified integration. Returns existing token if enabled, otherwise creates new one.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated or retrieved header token',
    type: GenerateHeaderTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized - Invalid or missing JWT token, or organization ID not found',
  })
  async generateHeaderToken(
    @Request() req: AuthenticatedRequest,
    @Body() body: GenerateHeaderTokenRequestDto,
  ): Promise<GenerateHeaderTokenResponseDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    if (!body || !body.integration_id) {
      throw new BadRequestException('Integration ID is required');
    }

    return this.integrationsService.generateHeaderToken(
      orgId,
      body.integration_id,
    );
  }

  @Post('connect')
  @ApiOperation({
    summary: 'Connect to third-party integration',
    description:
      'Connects to integrations via OAuth flow or direct credential storage. For OAuth integrations (GitHub, Slack, Confluence), returns authorization URL. For credential-based integrations (Jamf), stores encrypted credentials directly.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully connected or generated authorization URL',
    type: ConnectIntegrationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized - Invalid or missing JWT token, or organization ID not found',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid integration ID or unsupported integration type',
  })
  async connectIntegration(
    @Request() req: AuthenticatedRequest,
    @Body() body: ConnectIntegrationRequestDto,
  ): Promise<ConnectIntegrationResponseDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    if (!body || !body.integration_id) {
      throw new BadRequestException('Integration ID is required');
    }

    // Get integration details
    const integration = await this.integrationsService.findIntegrationByOrgAndId(
      orgId,
      body.integration_id,
    );

    if (!integration) {
      throw new BadRequestException(`Integration with ID ${body.integration_id} not found`);
    }

    const integrationName = integration.integration.name.toLowerCase();

    // Handle credential-based connections (Jamf, etc.)
    if (body.connection_type === 'credentials' && body.credentials) {
      return this.handleCredentialConnection(orgId, body.integration_id, integrationName, body.credentials);
    }

    // Handle OAuth connections (GitHub, Slack, Confluence) - default behavior
    return this.integrationsService.connectIntegration(
      orgId,
      body.integration_id,
    );
  }

  /**
   * Handle direct credential storage using factory pattern
   */
  private async handleCredentialConnection(
    orgId: number,
    integrationId: number,
    integrationName: string,
    credentials: Record<string, any>,
  ): Promise<ConnectIntegrationResponseDto> {
    try {
      return await this.integrationFactoryService.connectWithCredentials(
        integrationName,
        orgId,
        integrationId,
        credentials,
      );
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }

  @Post('callback')
  @ApiOperation({
    summary: 'Handle OAuth callback from third-party integration',
    description:
      'Processes the OAuth callback, exchanges code for tokens, and stores them securely. Updates org_integration_mapping status to connected.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully connected integration and stored tokens',
    type: CallbackResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized - Invalid or missing JWT token, or organization ID not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid callback data or OAuth exchange failed',
  })
  async handleCallback(
    @Request() req: AuthenticatedRequest,
    @Body() body: CallbackRequestDto,
  ): Promise<CallbackResponseDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    if (!body || !body.code || !body.state || !body.integration_id) {
      throw new BadRequestException(
        'Code, state, and integration_id are required',
      );
    }

    return this.integrationsService.handleCallback(orgId, body);
  }
}
