import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User name (derived from email)' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User role (null if no role assigned)' })
  role: string | null;

  @ApiProperty({ description: 'User team (null if no team assigned)' })
  team: string | null;

  @ApiProperty({ description: 'User status (1=active, 0=inactive)' })
  status: number;

  @ApiProperty({ description: 'Last login time (placeholder for now)' })
  lastLogin: string | null;

  @ApiProperty({ description: 'Join date' })
  joinDate: string;
}

export class GetUsersResponseDto {
  @ApiProperty({ description: 'List of users in the organization', type: [UserDto] })
  users: UserDto[];

  @ApiProperty({ description: 'Total number of users' })
  total: number;
}