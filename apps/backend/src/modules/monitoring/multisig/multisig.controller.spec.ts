import { Test, TestingModule } from '@nestjs/testing';
import { MultisigController } from './multisig.controller';
import { MultisigService } from './multisig.service';

describe('MultisigController', () => {
  let controller: MultisigController;
  let service: MultisigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultisigController],
      providers: [
        {
          provide: MultisigService,
          useValue: {
            registerWallet: jest.fn(),
            trackSignerChange: jest.fn(),
            trackThresholdChange: jest.fn(),
            trackApproval: jest.fn(),
            getAllWallets: jest.fn(),
            getActivitySummary: jest.fn(),
            getWalletDetails: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MultisigController>(MultisigController);
    service = module.get<MultisigService>(MultisigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerWallet', () => {
    it('should call service.registerWallet', async () => {
      const dto = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Treasury',
        threshold: 2,
        totalSigners: 3,
      };

      jest.spyOn(service, 'registerWallet').mockResolvedValue({
        id: 'wallet-1',
        ...dto,
        isActive: true,
      } as any);

      await controller.registerWallet(dto);

      expect(service.registerWallet).toHaveBeenCalledWith(dto);
    });
  });

  describe('trackSignerChange', () => {
    it('should call service.trackSignerChange', async () => {
      const dto = {
        walletId: 'wallet-1',
        signer: { address: '0x1234', name: 'Signer' },
        action: 'add' as const,
      };

      jest.spyOn(service, 'trackSignerChange').mockResolvedValue({} as any);

      await controller.trackSignerChange(dto);

      expect(service.trackSignerChange).toHaveBeenCalledWith(dto);
    });
  });

  describe('trackThresholdChange', () => {
    it('should call service.trackThresholdChange', async () => {
      const walletId = 'wallet-1';
      const dto = {
        previousThreshold: 2,
        newThreshold: 3,
        actor: '0x1234',
      };

      jest.spyOn(service, 'trackThresholdChange').mockResolvedValue({} as any);

      await controller.trackThresholdChange(walletId, dto);

      expect(service.trackThresholdChange).toHaveBeenCalledWith({
        ...dto,
        walletId,
      });
    });
  });

  describe('getAllWallets', () => {
    it('should return all wallets', async () => {
      const wallets = [
        {
          id: 'wallet-1',
          address: '0x1234',
          name: 'Treasury',
        },
      ];

      jest.spyOn(service, 'getAllWallets').mockResolvedValue(wallets as any);

      const result = await controller.getAllWallets();

      expect(result).toEqual(wallets);
      expect(service.getAllWallets).toHaveBeenCalled();
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary', async () => {
      const walletId = 'wallet-1';
      const summary = {
        walletId,
        address: '0x1234',
        name: 'Treasury',
        currentThreshold: 2,
        totalSigners: 3,
        activeSigners: 3,
        recentActivity: [],
        pendingApprovals: [],
      };

      jest.spyOn(service, 'getActivitySummary').mockResolvedValue(summary as any);

      const result = await controller.getActivitySummary(walletId);

      expect(result).toEqual(summary);
      expect(service.getActivitySummary).toHaveBeenCalledWith(walletId);
    });
  });
});
