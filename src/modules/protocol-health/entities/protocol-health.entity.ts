import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { HealthStatus } from '../enums';

@Entity('protocol_health')
export class ProtocolHealth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  protocol: string;

  @Column()
  status: HealthStatus;

  @Column('jsonb', { nullable: true })
  metrics: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}