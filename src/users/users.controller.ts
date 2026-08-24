import {
  Controller,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { UsersService } from './users.service';
import { GetUsersResponseDto } from './dto/get-users-response.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get users for organization',
    description:
      "Retrieves all users in the authenticated user's organization.",
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved users',
    type: GetUsersResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized - Invalid or missing JWT token, or organization ID not found',
  })
  async getUsers(
    @Request() req: AuthenticatedRequest,
  ): Promise<GetUsersResponseDto> {
    const orgId = req.user.orgId;

    if (!orgId) {
      throw new UnauthorizedException('Organization ID not found for user');
    }

    return this.usersService.getUsersByOrgId(orgId);
  }
}