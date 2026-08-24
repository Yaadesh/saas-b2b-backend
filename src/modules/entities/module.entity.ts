import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export interface ConfluenceDocument {
  id: string;
  title: string;
  url: string;
  spaceKey: string;
  spaceName: string;
}

export interface CustomTask {
  id: string;
  description: string;
  completed?: boolean;
}

export interface ModuleContent {
  confluenceDocuments?: ConfluenceDocument[];
  customTasks?: CustomTask[];
}

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column({ type: 'bigint' })
  org_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'jsonb', name: 'data' })
  content: ModuleContent;

  @Column({ type: 'smallint', default: 1 })
  is_active: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}