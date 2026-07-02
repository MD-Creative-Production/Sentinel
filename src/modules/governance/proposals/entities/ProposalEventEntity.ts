import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ProposalEventType } from '../types';

@Entity('governance_proposal_events')
@Index(['eventId'], { unique: true })
@Index(['chainId', 'proposalId'])
@Index(['chainId', 'eventType'])
@Index(['chainId', 'blockNumber'])
@Index(['chainId', 'timestamp'])
export class ProposalEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', unique: true })
  eventId!: string;

  @Column({ name: 'proposal_id' })
  proposalId!: string;

  @Column({ name: 'chain_id' })
  chainId!: number;

  @Column({
    name: 'event_type',
    type: 'varchar',
    enum: ProposalEventType,
  })
  eventType!: ProposalEventType;

  @Column({ name: 'block_number' })
  blockNumber!: number;

  @Column({ name: 'transaction_hash' })
  transactionHash!: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'simple-json' })
  data!: Record<string, unknown>;
}
