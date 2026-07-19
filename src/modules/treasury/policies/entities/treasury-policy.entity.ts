import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PolicyType, PolicyStatus, AlertSeverity, ThresholdType } from '../enums';

@Entity('treasury_policies')
@Index(['walletAddress', 'chainId'])
@Index(['status'])
@Index(['policyType'])
@Index(['chainId'])
export class TreasuryPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'policy_name' })
  policyName!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    enum: PolicyType,
  })
  policyType!: PolicyType;

  @Column({
    type: 'varchar',
    enum: PolicyStatus,
    default: PolicyStatus.Draft,
  })
  status!: PolicyStatus;

  @Column({ name: 'wallet_address' })
  walletAddress!: string;

  @Column({ name: 'chain_id' })
  chainId!: number;

  @Column({
    type: 'varchar',
    enum: ThresholdType,
  })
  thresholdType!: ThresholdType;

  @Column({ name: 'threshold_value', type: 'decimal', precision: 36, scale: 18 })
  thresholdValue!: string;

  @Column({ name: 'threshold_config', type: 'json', nullable: true })
  thresholdConfig?: Record<string, unknown>;

  @Column({
    type: 'varchar',
    enum: AlertSeverity,
    default: AlertSeverity.High,
  })
  severity!: AlertSeverity;

  @Column({ name: 'notification_preferences', type: 'json', nullable: true })
  notificationPreferences?: Record<string, unknown>;

  @Column({ name: 'approved_addresses', type: 'json', nullable: true })
  approvedAddresses?: string[];

  @Column({ name: 'business_hours_start', type: 'time', nullable: true })
  businessHoursStart?: string;

  @Column({ name: 'business_hours_end', type: 'time', nullable: true })
  businessHoursEnd?: string;

  @Column({ name: 'time_zone', type: 'varchar', length: 50, nullable: true })
  timeZone?: string;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
