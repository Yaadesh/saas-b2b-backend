import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Integration } from '../../integrations/entities/integration.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('role_integration_mapping')
export class RoleIntegrationMapping {
  @PrimaryColumn({ type: 'bigint' })
  role_id: number;

  @PrimaryColumn({ type: 'bigint' })
  integration_id: number;

  @PrimaryColumn({ type: 'bigint' })
  org_id: number;

  @Column({ type: 'jsonb', nullable: true })
  meta_data: any;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Integration)
  @JoinColumn({ name: 'integration_id' })
  integration: Integration;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}