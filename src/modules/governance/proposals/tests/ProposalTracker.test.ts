import { ethers } from 'ethers';
import { DataSource } from 'typeorm';
import { ProposalDetector } from '../ProposalDetector';
import { ProposalRepository } from '../ProposalRepository';
import { ProposalTracker } from '../ProposalTracker';
import { ProposalEventType, ProposalMetadata, ProposalState } from '../types';

const CHAIN_ID = 1;

function makeMetadata(overrides: Partial<ProposalMetadata> = {}): ProposalMetadata {
  return {
    id: '42',
    proposer: '0xProposer',
    targets: ['0xTarget'],
    values: ['0'],
    signatures: [''],
    calldatas: ['0x'],
    startBlock: 100,
    endBlock: 200,
    description: '# Upgrade treasury\nDetails here.',
    title: 'Upgrade treasury',
    state: ProposalState.Active,
    forVotes: '1000',
    againstVotes: '200',
    abstainVotes: '50',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    transactionHash: '0xdeadbeef',
    blockNumber: 99,
    ...overrides,
  };
}

function makeMockDs(): DataSource {
  return {
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      create: jest.fn((v: unknown) => v),
      save: jest.fn(async (v: unknown) => v),
      merge: jest.fn((existing: unknown, patch: unknown) => ({
        ...(existing as object),
        ...(patch as object),
      })),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getRawOne: jest.fn().mockResolvedValue({ maxBlock: null }),
      }),
    }),
  } as unknown as DataSource;
}

// ─── ProposalRepository ───────────────────────────────────────────────────────

describe('ProposalRepository', () => {
  let repo: ProposalRepository;
  let ds: DataSource;

  beforeEach(() => {
    ds = makeMockDs();
    repo = new ProposalRepository(ds);
  });

  describe('upsertProposal', () => {
    it('inserts a new proposal when it does not exist', async () => {
      const findOne = (ds.getRepository as jest.Mock)().findOne as jest.Mock;
      findOne.mockResolvedValue(null);
      const metadata = makeMetadata();
      await repo.upsertProposal(metadata, CHAIN_ID);
      const create = (ds.getRepository as jest.Mock)().create as jest.Mock;
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ proposalId: '42', chainId: CHAIN_ID, title: 'Upgrade treasury' }),
      );
    });

    it('updates an existing proposal when it already exists', async () => {
      const existing = makeMetadata({ state: ProposalState.Pending });
      const findOne = (ds.getRepository as jest.Mock)().findOne as jest.Mock;
      findOne.mockResolvedValue(existing);
      await repo.upsertProposal(makeMetadata({ state: ProposalState.Executed }), CHAIN_ID);
      const merge = (ds.getRepository as jest.Mock)().merge as jest.Mock;
      expect(merge).toHaveBeenCalledWith(
        existing,
        expect.objectContaining({ state: ProposalState.Executed }),
      );
    });
  });

  describe('persistEvent', () => {
    it('skips duplicate events', async () => {
      const findOne = (ds.getRepository as jest.Mock)().findOne as jest.Mock;
      findOne.mockResolvedValue({ eventId: 'exists' });
      const save = (ds.getRepository as jest.Mock)().save as jest.Mock;
      await repo.persistEvent(
        {
          id: '42-ProposalCreated-0xdeadbeef',
          proposalId: '42',
          eventType: ProposalEventType.Created,
          blockNumber: 99,
          transactionHash: '0xdeadbeef',
          timestamp: new Date(),
          data: {},
        },
        CHAIN_ID,
      );
      expect(save).not.toHaveBeenCalled();
    });

    it('saves a new event', async () => {
      const findOne = (ds.getRepository as jest.Mock)().findOne as jest.Mock;
      findOne.mockResolvedValue(null);
      const save = (ds.getRepository as jest.Mock)().save as jest.Mock;
      await repo.persistEvent(
        {
          id: '42-ProposalCreated-0xdeadbeef',
          proposalId: '42',
          eventType: ProposalEventType.Created,
          blockNumber: 99,
          transactionHash: '0xdeadbeef',
          timestamp: new Date(),
          data: { proposer: '0xProposer' },
        },
        CHAIN_ID,
      );
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLastIndexedBlock', () => {
    it('returns null when no proposals are indexed', async () => {
      const result = await repo.getLastIndexedBlock(CHAIN_ID);
      expect(result).toBeNull();
    });

    it('returns the maximum block number across stored proposals', async () => {
      (ds.getRepository as jest.Mock)()
        .createQueryBuilder()
        .getRawOne.mockResolvedValue({ maxBlock: 1500 });
      const result = await repo.getLastIndexedBlock(CHAIN_ID);
      expect(result).toBe(1500);
    });
  });
});

// ─── ProposalTracker ──────────────────────────────────────────────────────────

describe('ProposalTracker', () => {
  let tracker: ProposalTracker;
  let mockDetector: jest.Mocked<
    Pick<
      ProposalDetector,
      | 'fetchHistoricalProposals'
      | 'subscribe'
      | 'unsubscribe'
      | 'getProposalState'
      | 'getProposalVotes'
    >
  >;
  let mockRepo: jest.Mocked<
    Pick<
      ProposalRepository,
      | 'getLastIndexedBlock'
      | 'upsertProposal'
      | 'persistEvent'
      | 'updateProposalState'
      | 'searchProposals'
    >
  >;

  beforeEach(() => {
    mockDetector = {
      fetchHistoricalProposals: jest.fn().mockResolvedValue([]),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      getProposalState: jest.fn().mockResolvedValue(ProposalState.Active),
      getProposalVotes: jest
        .fn()
        .mockResolvedValue({ forVotes: '0', againstVotes: '0', abstainVotes: '0' }),
    };

    mockRepo = {
      getLastIndexedBlock: jest.fn().mockResolvedValue(null),
      upsertProposal: jest.fn().mockResolvedValue({}),
      persistEvent: jest.fn().mockResolvedValue({}),
      updateProposalState: jest.fn().mockResolvedValue(undefined),
      searchProposals: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };

    // Pass mockDetector directly — no real ethers provider needed
    tracker = new ProposalTracker(
      {} as ethers.Provider,
      makeMockDs(),
      {
        governorAddress: '0xGovernor',
        chainId: CHAIN_ID,
        startBlock: 0,
        pollIntervalMs: 99_999_999,
      },
      mockDetector as unknown as ProposalDetector,
    );
    (tracker as unknown as { repo: typeof mockRepo }).repo = mockRepo;
  });

  afterEach(() => {
    tracker.stop();
  });

  it('calls fetchHistoricalProposals on start', async () => {
    await tracker.start();
    expect(mockDetector.fetchHistoricalProposals).toHaveBeenCalled();
  });

  it('resumes from the last indexed block', async () => {
    (mockRepo.getLastIndexedBlock as jest.Mock).mockResolvedValue(500);
    await tracker.start();
    expect(mockDetector.fetchHistoricalProposals).toHaveBeenCalledWith(500, 'latest');
  });

  it('persists each historical proposal and its events', async () => {
    const metadata = makeMetadata();
    (mockDetector.fetchHistoricalProposals as jest.Mock).mockResolvedValue([
      {
        metadata,
        events: [
          {
            id: '42-ProposalCreated-0xdeadbeef',
            proposalId: '42',
            eventType: ProposalEventType.Created,
            blockNumber: 99,
            transactionHash: '0xdeadbeef',
            timestamp: new Date(),
            data: {},
          },
        ],
      },
    ]);
    await tracker.start();
    expect(mockRepo.upsertProposal).toHaveBeenCalledWith(metadata, CHAIN_ID);
    expect(mockRepo.persistEvent).toHaveBeenCalledTimes(1);
  });

  it('subscribes to live events on start', async () => {
    await tracker.start();
    expect(mockDetector.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        onProposalCreated: expect.any(Function),
        onProposalCanceled: expect.any(Function),
        onProposalQueued: expect.any(Function),
        onProposalExecuted: expect.any(Function),
        onVoteCast: expect.any(Function),
      }),
    );
  });

  it('unsubscribes on stop', async () => {
    await tracker.start();
    tracker.stop();
    expect(mockDetector.unsubscribe).toHaveBeenCalled();
  });
});
