import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Headers,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserCommand } from './commands/create-user.command';
import { ScimUserDto } from './dto/scim-user.dto';
import { CreateScimUserDto } from './dto/create-scim-user.dto';
import { ScimServiceProviderConfigDto } from './dto/scim-service-provider-config.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    orgId: number | null;
    payload: any;
    user: any;
  };
}

@ApiTags('scim')
@Controller('scim/v2')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ScimController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('Users')
  @ApiOperation({
    summary: 'Create user (SCIM 2.0)',
    description:
      "Create a new user in the organization using SCIM 2.0 format. The user will be added to the authenticated user's organization.",
  })
  @ApiHeader({
    name: 'Content-Type',
    required: true,
    description: 'Content type for SCIM requests',
    example: 'application/scim+json',
    schema: { type: 'string', default: 'application/scim+json' },
  })
  @ApiHeader({
    name: 'Accept',
    required: false,
    description: 'Accept header for SCIM responses',
    example: 'application/scim+json',
    schema: { type: 'string', default: 'application/scim+json' },
  })
  @ApiBody({
    description: 'SCIM user creation data',
    type: CreateScimUserDto,
    examples: {
      example1: {
        summary: 'Basic user creation',
        value: {
          schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
          userName: 'john.doe@example.com',
          name: {
            givenName: 'John',
            familyName: 'Doe',
            formatted: 'John Doe',
          },
          emails: [
            {
              value: 'john.doe@example.com',
              type: 'work',
              primary: true,
            },
          ],
          active: true,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: ScimUserDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid SCIM data or missing email',
  })
  async createUser(
    @Request() req: AuthenticatedRequest,
    @Body() createUserDto: CreateScimUserDto,
    @Headers('accept') accept?: string,
  ): Promise<ScimUserDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    // Extract primary email
    const primaryEmail =
      createUserDto.emails?.find((email) => email.primary) ||
      createUserDto.emails?.[0];
    if (!primaryEmail) {
      throw new BadRequestException('At least one email is required');
    }

    // Create user via command
    const user = await this.commandBus.execute(
      new CreateUserCommand(
        primaryEmail.value,
        orgId,
        createUserDto.displayName,
        createUserDto.active ?? true,
      ),
    );

    // Return SCIM format
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: user.id.toString(),
      userName: user.email,
      displayName: createUserDto.displayName || user.email,
      emails: createUserDto.emails,
      active: user.status === 1,
      meta: {
        resourceType: 'User',
        created: user.created_at.toISOString(),
        lastModified: user.updated_at.toISOString(),
        location: `/scim/v2/Users/${user.id}`,
        version: `W/"${user.updated_at.getTime()}"`,
      },
    };
  }

  @Get('ServiceProviderConfig')
  @ApiOperation({
    summary: 'Get SCIM Service Provider Configuration',
    description:
      'Returns the SCIM 2.0 service provider configuration describing supported operations and capabilities.',
  })
  @ApiHeader({
    name: 'Accept',
    required: false,
    description: 'Accept header for SCIM responses',
    example: 'application/scim+json',
    schema: { type: 'string', default: 'application/scim+json' },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved service provider configuration',
    type: ScimServiceProviderConfigDto,
    headers: {
      'Content-Type': {
        description: 'Response content type',
        schema: { type: 'string', example: 'application/scim+json' },
      },
    },
  })
  async getServiceProviderConfig(): Promise<ScimServiceProviderConfigDto> {
    const currentDate = new Date().toISOString();

    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      documentationUri: 'https://tools.ietf.org/html/rfc7644',
      patch: {
        supported: false,
      },
      bulk: {
        supported: false,
        maxOperations: 0,
        maxPayloadSize: 0,
      },
      filter: {
        supported: true,
        maxResults: 200,
      },
      changePassword: {
        supported: false,
      },
      sort: {
        supported: false,
      },
      etag: {
        supported: false,
      },
      authenticationSchemes: [
        {
          name: 'OAuth Bearer Token',
          description:
            'Authentication scheme using the OAuth Bearer Token Standard',
          specUri: 'https://tools.ietf.org/html/rfc6750',
          documentationUri: 'https://tools.ietf.org/html/rfc6750',
          type: 'oauthbearertoken',
          primary: true,
        },
      ],
      meta: {
        location: '/scim/v2/ServiceProviderConfig',
        resourceType: 'ServiceProviderConfig',
        created: currentDate,
        lastModified: currentDate,
        version: 'W/"1"',
      },
    };
  }
}
