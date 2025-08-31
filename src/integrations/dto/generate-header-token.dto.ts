import { ApiProperty } from '@nestjs/swagger';

export class GenerateHeaderTokenRequestDto {
  @ApiProperty({
    description: 'Integration ID for which to generate header token',
    example: 1,
  })
  integration_id: number;
}

export class GenerateHeaderTokenResponseDto {
  @ApiProperty({
    description: 'Generated header token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  header_token: string;
}
