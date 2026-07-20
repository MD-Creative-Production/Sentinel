import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
import { AlertSeverity } from '../enums/alert-severity.enum';

@Entity('governance_vote_alerts')
@Index(['proposalId', 'chainId'])
@Index(['chainId', 'severity'])
@Index(['alertType'])
@Index(['createdAt'])
export class VoteAlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id' })
  proposalId!: string;

  @Column({ name: 'chain_id' })
  chainId!: number;

  @Column({ name: 'proposal_title' })
  proposalTitle!: string;

  @Column({ name: 'alert_type' })
  alertType!: string;

  @Column({
    type: 'varchar',
    enum: AlertSeverity,
    default: AlertSeverity.Info,
  })
  severity!: AlertSeverity;

  @Column({ name: 'outcome', nullable: true })
  outcome?: string;

  @Column({ name: 'message', type: 'text' })
  message!: string;

  @Column({ name: 'proposal_link', nullable: true })
  proposalLink?: string;

  @Column({ name: 'network', nullable: true })
  network?: string;

  @Column({ name: 'notified', type: 'boolean', default: false })
  notified!: boolean;

  @Column({ name: 'notification_sent_at', type: 'timestamp', nullable: true })
  notificationSentAt?: Date;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
