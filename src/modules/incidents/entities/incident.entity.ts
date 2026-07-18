import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IncidentStatus, IncidentSeverity } from '../enums';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  status: IncidentStatus;

  @Column()
  severity: IncidentSeverity;

  // Placeholder for related alerts
  // @OneToMany(() => Alert, alert => alert.incident)
  // alerts: Alert[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}