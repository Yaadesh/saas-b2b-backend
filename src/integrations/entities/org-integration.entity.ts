import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Integration } from './integration.entity';

@Entity('org_integration_mapping')
export class OrgIntegrationMapping {
  @PrimaryColumn({ type: 'bigint' })
  org_id: number;

  @PrimaryColumn({ type: 'bigint' })
  integration_id: number;

  @Column({ type: 'smallint', nullable: true })
  status: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Integration)
  @JoinColumn({ name: 'integration_id' })
  integration: Integration;
}
