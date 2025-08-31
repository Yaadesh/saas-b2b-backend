import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { GetIntegrationsResponseDto } from './dto/get-integrations-response.dto';
import {
  GenerateHeaderTokenRequestDto,
  GenerateHeaderTokenResponseDto,
} from './dto/generate-header-token.dto';

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
}
