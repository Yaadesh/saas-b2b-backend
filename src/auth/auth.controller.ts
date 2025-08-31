import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      "Retrieve the authenticated user's profile information extracted from JWT token",
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user profile',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID from JWT',
          example: 'user123',
        },
        email: {
          type: 'string',
          description: 'User email',
          example: 'user@example.com',
        },
        orgId: {
          type: 'number',
          description: 'Organization ID',
          example: 123,
          nullable: true,
        },
        payload: { type: 'object', description: 'Full JWT payload' },
        user: {
          type: 'object',
          description: 'User database record',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  getProfile(@Request() req) {
    return req.user;
  }
}
