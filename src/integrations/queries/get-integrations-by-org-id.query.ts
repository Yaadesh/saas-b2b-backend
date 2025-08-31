import { IQuery } from '@nestjs/cqrs';

export class GetIntegrationsByOrgIdQuery implements IQuery {
  constructor(public readonly orgId: number) {}
}
