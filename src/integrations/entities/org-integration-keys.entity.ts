import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity('org_integration_keys')
export class OrgIntegrationKeys {
  @PrimaryColumn({ type: 'bigint' })
  org_id: number;

  @PrimaryColumn({ type: 'bigint' })
  integration_id: number;

  @Column({ type: 'jsonb' })
  data: any;

  @Column({ type: 'int', default: 0 })
  is_enabled: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
