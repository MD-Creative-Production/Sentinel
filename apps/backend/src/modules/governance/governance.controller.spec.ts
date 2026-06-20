import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { GovernanceEventDto, ProposalDto, VoteDto } from './interfaces/governance.interface';

describe('GovernanceController', () => {
  let controller: GovernanceController;
  let service: GovernanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [
        {
          provide: GovernanceService,
          useValue: {
            trackProposal: jest.fn(),
            getProposals: jest.fn(),
            trackVote: jest.fn(),
            getVotes: jest.fn(),
            logEvent: jest.fn(),
            getEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GovernanceController>(GovernanceController);
    service = module.get<GovernanceService>(GovernanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('trackProposal', () => {
    it('should call trackProposal on service', async () => {
      const dto: ProposalDto = { title: 'T', description: 'D', proposer: 'P' };
      await controller.trackProposal(dto);
      expect(service.trackProposal).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProposals', () => {
    it('should call getProposals on service', async () => {
      await controller.getProposals();
      expect(service.getProposals).toHaveBeenCalled();
    });
  });

  describe('trackVote', () => {
    it('should call trackVote on service', async () => {
      const dto: VoteDto = { proposalId: '1', voter: 'V', choice: 'yes', weight: '1' };
      await controller.trackVote(dto);
      expect(service.trackVote).toHaveBeenCalledWith(dto);
    });
  });

  describe('getVotes', () => {
    it('should call getVotes on service', async () => {
      await controller.getVotes('1');
      expect(service.getVotes).toHaveBeenCalledWith('1');
    });
  });

  describe('logEvent', () => {
    it('should call logEvent on service', async () => {
      const dto: GovernanceEventDto = { eventType: 'create', transactionHash: '0x' };
      await controller.logEvent(dto);
      expect(service.logEvent).toHaveBeenCalledWith(dto);
    });
  });

  describe('getEvents', () => {
    it('should call getEvents on service', async () => {
      await controller.getEvents();
      expect(service.getEvents).toHaveBeenCalled();
    });
  });
});
