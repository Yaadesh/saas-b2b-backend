import { OrganizationDto } from '../../organizations/dto/organization.dto';

export class UserDto {
  id: number;
  org_id: number;
  email: string;
  status: number;
  created_at: Date;
  updated_at: Date;
  organization?: OrganizationDto;
}
