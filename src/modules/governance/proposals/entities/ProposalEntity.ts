import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ProposalState } from '../types';

@Entity('governance_proposals')
@Index(['proposalId', 'chainId'], { unique: true })
@Index(['chainId', 'state'])
@Index(['chainId', 'proposer'])
@Index(['chainId', 'blockNumber'])
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id' })
  proposalId!: string;

  @Column({ name: 'chain_id' })
  chainId!: number;

  @Column()
  proposer!: string;

  @Column('simple-array')
  targets!: string[];

  @Column('simple-array')
  values!: string[];

  @Column('simple-array', { nullable: true })
  signatures!: string[];

  @Column('simple-json')
  calldatas!: string[];

  @Column({ name: 'start_block' })
  startBlock!: number;

  @Column({ name: 'end_block' })
  endBlock!: number;

  @Column('text')
  description!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({
    type: 'varchar',
    enum: ProposalState,
    default: ProposalState.Pending,
  })
  state!: ProposalState;

  @Column({ name: 'for_votes', default: '0' })
  forVotes!: string;

  @Column({ name: 'against_votes', default: '0' })
  againstVotes!: string;

  @Column({ name: 'abstain_votes', default: '0' })
  abstainVotes!: string;

  @Column({ name: 'transaction_hash' })
  transactionHash!: string;

  @Column({ name: 'block_number' })
  blockNumber!: number;

  @Column({ name: 'eta', nullable: true, type: 'int' })
  eta?: number;

  @Column({ name: 'queued_at', nullable: true, type: 'timestamp' })
  queuedAt?: Date;

  @Column({ name: 'executed_at', nullable: true, type: 'timestamp' })
  executedAt?: Date;

  @Column({ name: 'canceled_at', nullable: true, type: 'timestamp' })
  canceledAt?: Date;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
