import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VoteOutcome } from '../enums/vote-outcome.enum';
import { ProposalType } from '../enums/proposal-type.enum';
import { ProposalImpact } from '../enums/proposal-impact.enum';

@Entity('governance_vote_outcomes')
@Index(['proposalId', 'chainId'], { unique: true })
@Index(['chainId', 'outcome'])
@Index(['chainId', 'votingEndedAt'])
@Index(['proposalType'])
@Index(['proposalImpact'])
export class VoteOutcomeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id' })
  proposalId!: string;

  @Column({ name: 'chain_id' })
  chainId!: number;

  @Column({ name: 'proposal_title' })
  proposalTitle!: string;

  @Column({ name: 'proposal_description', type: 'text', nullable: true })
  proposalDescription?: string;

  @Column({
    type: 'varchar',
    enum: ProposalType,
    default: ProposalType.Other,
  })
  proposalType!: ProposalType;

  @Column({
    type: 'varchar',
    enum: ProposalImpact,
    default: ProposalImpact.LowImpact,
  })
  proposalImpact!: ProposalImpact;

  @Column({
    type: 'varchar',
    enum: VoteOutcome,
    default: VoteOutcome.Pending,
  })
  outcome!: VoteOutcome;

  @Column({ name: 'voting_start_time', type: 'timestamp' })
  votingStartTime!: Date;

  @Column({ name: 'voting_end_time', type: 'timestamp' })
  votingEndTime!: Date;

  @Column({ name: 'voting_ended_at', type: 'timestamp', nullable: true })
  votingEndedAt?: Date;

  @Column({ name: 'execution_timestamp', type: 'timestamp', nullable: true })
  executionTimestamp?: Date;

  @Column({ name: 'total_votes', default: '0' })
  totalVotes!: string;

  @Column({ name: 'yes_votes', default: '0' })
  yesVotes!: string;

  @Column({ name: 'no_votes', default: '0' })
  noVotes!: string;

  @Column({ name: 'abstain_votes', default: '0' })
  abstainVotes!: string;

  @Column({ name: 'veto_votes', default: '0' })
  vetoVotes!: string;

  @Column({
    name: 'participation_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  participationPercentage?: number;

  @Column({ name: 'proposal_link', nullable: true })
  proposalLink?: string;

  @Column({ name: 'previous_state', nullable: true })
  previousState?: string;

  @Column({ name: 'processed', type: 'boolean', default: false })
  processed!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
