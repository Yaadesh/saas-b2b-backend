import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { CreateUserCommand } from '../create-user.command';
import { User } from '../../entities/user.entity';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: command.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${command.email} already exists`,
      );
    }

    const user = this.userRepository.create({
      email: command.email,
      org_id: command.orgId,
      status: command.active ? 1 : 0, // 1 = active, 0 = inactive
    });

    return this.userRepository.save(user);
  }
}
