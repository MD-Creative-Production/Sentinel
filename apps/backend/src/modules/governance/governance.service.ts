import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ProposalDto, VoteDto, GovernanceEventDto } from './interfaces/governance.interface';

@Injectable()
export class GovernanceService {
  private prisma: PrismaClient;

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
        metadata: dto.metadata || {},
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
