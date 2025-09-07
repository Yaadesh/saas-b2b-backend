import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { GetUsersResponseDto, UserDto } from './dto/get-users-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUsersByOrgId(orgId: number): Promise<GetUsersResponseDto> {
    const users = await this.userRepository.find({
      where: { org_id: orgId },
      relations: ['organization'],
    });

    const userDtos: UserDto[] = users.map((user) => {
      // Extract name from email (before @ symbol)
      const name = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        id: user.id,
        name,
        email: user.email,
        role: null, // Will be null until user_role_mapping is implemented
        team: null, // Will be null until team mapping is implemented
        status: user.status,
        lastLogin: null, // Placeholder for now
        joinDate: user.created_at.toISOString().split('T')[0], // Format as YYYY-MM-DD
      };
    });

    return {
      users: userDtos,
      total: users.length,
    };
  }
}