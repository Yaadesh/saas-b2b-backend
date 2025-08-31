import { ApiProperty } from '@nestjs/swagger';

export class ConnectIntegrationRequestDto {
  @ApiProperty({
    description: 'Integration ID to connect',
    example: 1,
  })
  integration_id: number;
}

export class ConnectIntegrationResponseDto {
  @ApiProperty({
    description: 'Authorization URL to redirect user to',
    example:
      'https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...',
  })
  authorization_url: string;

  @ApiProperty({
    description: 'State parameter for OAuth flow',
    example: 'random-state-string',
  })
  state: string;
}

export class CallbackRequestDto {
  @ApiProperty({
    description: 'Authorization code from OAuth provider',
    example: 'github_auth_code_123',
  })
  code: string;

  @ApiProperty({
    description: 'State parameter to validate OAuth flow',
    example: 'random-state-string',
  })
  state: string;

  @ApiProperty({
    description: 'Integration ID for the callback',
    example: 1,
  })
  integration_id: number;
}

export class CallbackResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Integration connected successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Integration status',
    example: 'connected',
  })
  status: string;
}
