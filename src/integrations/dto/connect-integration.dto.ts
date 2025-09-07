import { ApiProperty } from '@nestjs/swagger';

export class ConnectIntegrationRequestDto {
  @ApiProperty({
    description: 'Integration ID to connect',
    example: 1,
  })
  integration_id: number;

  @ApiProperty({
    description: 'Connection type - oauth for OAuth flow, credentials for direct credential storage',
    example: 'oauth',
    enum: ['oauth', 'credentials'],
    required: false,
  })
  connection_type?: 'oauth' | 'credentials';

  @ApiProperty({
    description: 'Credentials data for direct connection (varies by integration)',
    example: { clientKey: 'key', clientSecret: 'secret' },
    required: false,
  })
  credentials?: Record<string, any>;
}

export class ConnectIntegrationResponseDto {
  @ApiProperty({
    description: 'Authorization URL to redirect user to (for OAuth)',
    example:
      'https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...',
    required: false,
  })
  authorization_url?: string;

  @ApiProperty({
    description: 'State parameter for OAuth flow',
    example: 'random-state-string',
    required: false,
  })
  state?: string;

  @ApiProperty({
    description: 'Success indicator for credential connections',
    example: true,
    required: false,
  })
  success?: boolean;

  @ApiProperty({
    description: 'Message for credential connections',
    example: 'Successfully connected to integration',
    required: false,
  })
  message?: string;
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
