import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from './commands/create-user.command';
import { ScimUserDto } from './dto/scim-user.dto';
import { CreateScimUserDto } from './dto/create-scim-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class ScimService {
  constructor(private readonly commandBus: CommandBus) {}

  async createUser(
    createUserDto: CreateScimUserDto,
    orgId: number,
  ): Promise<ScimUserDto> {
    const primaryEmail =
      createUserDto.emails?.find((email) => email.primary) ||
      createUserDto.emails?.[0];
    if (!primaryEmail) {
      throw new Error('At least one email is required');
    }

    const user: User = await this.commandBus.execute(
      new CreateUserCommand(
        primaryEmail.value,
        orgId,
        createUserDto.displayName,
        createUserDto.active ?? true,
      ),
    );

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
}
