import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly orgId: number,
    public readonly displayName?: string,
    public readonly active: boolean = true,
  ) {}
}
