import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('integration_type')
export class IntegrationType {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  type: string;
}