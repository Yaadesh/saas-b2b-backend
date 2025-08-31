import { IQuery } from '@nestjs/cqrs';

export class GetOrganizationByIdQuery implements IQuery {
  constructor(public readonly id: number) {}
}
