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
import { Module } from '../../modules/entities/module.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('role_module_mapping')
export class RoleModuleMapping {
  @PrimaryColumn({ type: 'bigint' })
  role_id: number;

  @PrimaryColumn({ type: 'bigint' })
  module_id: number;

  @PrimaryColumn({ type: 'bigint' })
  org_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Module)
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}