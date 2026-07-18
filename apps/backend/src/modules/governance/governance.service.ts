import { Injectable, NotFoundException } from '@nestjs/common';
// Use runtime require for PrismaClient to avoid TypeScript type export issues in the
// environment where the generated client types may not be present during linting.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
import { ProposalDto, VoteDto, GovernanceEventDto } from './interfaces/governance.interface';

@Injectable()
export class GovernanceService {
  // Prisma client instance - using `any` for the private field to avoid tight coupling
  // with generated client types during linting/build in different environments.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async trackProposal(dto: ProposalDto) {
    const proposal = await this.prisma.proposal.create({
      data: {
        title: dto.title,
        description: dto.description,
        proposer: dto.proposer,
      },
    });
    return proposal;
  }

  async getProposals() {
    return this.prisma.proposal.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async trackVote(dto: VoteDto) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: dto.proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${dto.proposalId} not found`);
    }

    const vote = await this.prisma.vote.create({
      data: {
        proposalId: dto.proposalId,
        voter: dto.voter,
        choice: dto.choice,
        weight: dto.weight,
      },
    });

    return vote;
  }

  async getVotes(proposalId: string) {
    return this.prisma.vote.findMany({
      where: { proposalId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async logEvent(dto: GovernanceEventDto) {
    const event = await this.prisma.governanceEvent.create({
      data: {
        eventType: dto.eventType,
        proposalId: dto.proposalId,
        voter: dto.voter,
        transactionHash: dto.transactionHash,
        // Prisma expects JSON; use the provided metadata or fall back to empty object
        metadata: dto.metadata ?? {},
      },
    });
    return event;
  }

  async getEvents() {
    return this.prisma.governanceEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
