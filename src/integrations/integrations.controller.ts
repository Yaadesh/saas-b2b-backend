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
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get integrations for organization',
    description:
      "Retrieves all available integrations and organization-specific integration status. Requires authentication and automatically filters by user's organization.",
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
  ): Promise<GetIntegrationsResponseDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    return this.integrationsService.findIntegrationsByOrgId(orgId);
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
    summary: 'Initiate OAuth connection for third-party integration',
    description:
      'Starts the OAuth flow for connecting GitHub, Slack, or Confluence. Returns authorization URL to redirect user to.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated authorization URL',
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

    return this.integrationsService.connectIntegration(
      orgId,
      body.integration_id,
    );
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
