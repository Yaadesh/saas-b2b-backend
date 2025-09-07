import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IntegrationType } from './integration-type.entity';

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_enabled: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  meta_data: {
    display_name?: string;
    subtext?: string;
    extra?: string;
    [key: string]: any;
  };

  @Column({ type: 'int', nullable: false })
  integration_type: number;

  @ManyToOne(() => IntegrationType)
  @JoinColumn({ name: 'integration_type' })
  integrationType: IntegrationType;
}
