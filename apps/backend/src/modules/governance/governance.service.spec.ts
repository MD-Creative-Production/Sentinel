import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceService } from './governance.service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    proposal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    vote: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    governanceEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('GovernanceService', () => {
  let service: GovernanceService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GovernanceService],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
    // GovernanceService instantiates its own PrismaClient, so we can grab the mock instance
    prisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackProposal', () => {
    it('should create a proposal', async () => {
      const dto = { title: 'Test', description: 'Desc', proposer: 'User1' };
      const expected = { id: '1', ...dto };

      (prisma.proposal.create as jest.Mock).mockResolvedValue(expected);

      const result = await service.trackProposal(dto);

      expect(prisma.proposal.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(expected);
    });
  });

  describe('trackVote', () => {
    it('should create a vote if proposal exists', async () => {
      const dto = { proposalId: '1', voter: 'User1', choice: 'yes', weight: '10' };
      const expected = { id: '1', ...dto };

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.vote.create as jest.Mock).mockResolvedValue(expected);

      const result = await service.trackVote(dto);

      expect(prisma.vote.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundException if proposal does not exist', async () => {
      const dto = { proposalId: '99', voter: 'User1', choice: 'yes', weight: '10' };

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.trackVote(dto)).rejects.toThrow('Proposal 99 not found');
    });
  });
});
