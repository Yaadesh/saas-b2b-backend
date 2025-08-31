import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetOrganizationByIdQuery } from '../get-organization-by-id.query';
import { Organization } from '../../entities/organization.entity';

@QueryHandler(GetOrganizationByIdQuery)
export class GetOrganizationByIdHandler
  implements IQueryHandler<GetOrganizationByIdQuery>
{
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async execute(query: GetOrganizationByIdQuery): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { id: query.id },
    });
  }
}
