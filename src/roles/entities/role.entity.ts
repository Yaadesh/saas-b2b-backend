import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { RoleIntegrationMapping } from './role-integration-mapping.entity';
import { UserRoleMapping } from './user-role-mapping.entity';
import { RoleModuleMapping } from './role-module-mapping.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  org_id: number;

  @Column({ type: 'bigint' })
  role_type_id: number;

  @Column({ type: 'varchar', nullable: true })
  team_name: string;

  @Column({ type: 'varchar' })
  title: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @OneToMany(() => RoleIntegrationMapping, mapping => mapping.role, { cascade: ['remove'] })
  roleIntegrations: RoleIntegrationMapping[];

  @OneToMany(() => UserRoleMapping, mapping => mapping.role, { cascade: ['remove'] })
  userRoles: UserRoleMapping[];

  @OneToMany(() => RoleModuleMapping, mapping => mapping.role, { cascade: ['remove'] })
  roleModules: RoleModuleMapping[];
}