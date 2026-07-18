import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('policy_audit_logs')
@Index(['policyId'])
@Index(['action'])
@Index(['performedBy'])
@Index(['createdAt'])
export class PolicyAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'policy_id' })
  policyId!: string;

  @Column({ name: 'action' })
  action!: string;

  @Column({ name: 'performed_by' })
  performedBy!: string;

  @Column({ name: 'changes', type: 'json', nullable: true })
  changes?: Record<string, unknown>;

  @Column({ name: 'previous_state', type: 'json', nullable: true })
  previousState?: Record<string, unknown>;

  @Column({ name: 'new_state', type: 'json', nullable: true })
  newState?: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
