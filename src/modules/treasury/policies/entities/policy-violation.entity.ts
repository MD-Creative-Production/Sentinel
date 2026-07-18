import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ViolationStatus, AlertSeverity } from '../enums';

@Entity('policy_violations')
@Index(['policyId'])
@Index(['walletAddress', 'chainId'])
@Index(['transactionHash'])
@Index(['status'])
@Index(['severity'])
@Index(['createdAt'])
export class PolicyViolationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'policy_id' })
  policyId!: string;

  @Column({ name: 'policy_name' })
  policyName!: string;

  @Column({ name: 'wallet_address' })
  walletAddress!: string;

  @Column({ name: 'chain_id' })
  chainId!: number;

  @Column({ name: 'transaction_hash' })
  transactionHash!: string;

  @Column({ name: 'transaction_block', type: 'bigint', nullable: true })
  transactionBlock?: string;

  @Column({ name: 'violated_rule' })
  violatedRule!: string;

  @Column({ name: 'threshold_value', type: 'decimal', precision: 36, scale: 18 })
  thresholdValue!: string;

  @Column({ name: 'observed_value', type: 'decimal', precision: 36, scale: 18 })
  observedValue!: string;

  @Column({ name: 'transaction_amount', type: 'decimal', precision: 36, scale: 18, nullable: true })
  transactionAmount?: string;

  @Column({ name: 'recipient_address', nullable: true })
  recipientAddress?: string;

  @Column({ name: 'balance_before', type: 'decimal', precision: 36, scale: 18, nullable: true })
  balanceBefore?: string;

  @Column({ name: 'balance_after', type: 'decimal', precision: 36, scale: 18, nullable: true })
  balanceAfter?: string;

  @Column({
    type: 'varchar',
    enum: AlertSeverity,
  })
  severity!: AlertSeverity;

  @Column({
    type: 'varchar',
    enum: ViolationStatus,
    default: ViolationStatus.Active,
  })
  status!: ViolationStatus;

  @Column({ name: 'recommended_action', type: 'text', nullable: true })
  recommendedAction?: string;

  @Column({ name: 'context_data', type: 'json', nullable: true })
  contextData?: Record<string, unknown>;

  @Column({ name: 'acknowledged_by', type: 'varchar', length: 255, nullable: true })
  acknowledgedBy?: string;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @Column({ name: 'resolved_by', type: 'varchar', length: 255, nullable: true })
  resolvedBy?: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes?: string;

  @Column({ name: 'alert_sent', type: 'boolean', default: false })
  alertSent!: boolean;

  @Column({ name: 'alert_sent_at', type: 'timestamp', nullable: true })
  alertSentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
