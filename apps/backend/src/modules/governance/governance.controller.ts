import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { ProposalDto, VoteDto, GovernanceEventDto } from './interfaces/governance.interface';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post('proposals')
  async trackProposal(@Body() dto: ProposalDto) {
    return this.governanceService.trackProposal(dto);
  }

  @Get('proposals')
  async getProposals() {
    return this.governanceService.getProposals();
  }

  @Post('votes')
  async trackVote(@Body() dto: VoteDto) {
    return this.governanceService.trackVote(dto);
  }

  @Get('votes/:proposalId')
  async getVotes(@Param('proposalId') proposalId: string) {
    return this.governanceService.getVotes(proposalId);
  }

  @Post('events')
  async logEvent(@Body() dto: GovernanceEventDto) {
    return this.governanceService.logEvent(dto);
  }

  @Get('events')
  async getEvents() {
    return this.governanceService.getEvents();
  }
}
