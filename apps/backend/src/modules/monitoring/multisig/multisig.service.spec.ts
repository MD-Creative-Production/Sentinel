import { Test, TestingModule } from '@nestjs/testing';
import { MultisigService } from './multisig.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('MultisigService', () => {
  let service: MultisigService;
  let notificationsService: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultisigService,
        {
          provide: NotificationsService,
          useValue: {
            sendAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MultisigService>(MultisigService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWallet', () => {
    it('should register a new multisig wallet', async () => {
      const walletDto = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Treasury Wallet',
        description: 'Main treasury multisig',
        threshold: 2,
        totalSigners: 3,
        organizationName: 'Org A',
      };

      const result = await service.registerWallet(walletDto);

      expect(result).toBeDefined();
      expect(result.address).toBe(walletDto.address);
      expect(result.threshold).toBe(walletDto.threshold);
    });

    it('should throw ConflictException if wallet already exists', async () => {
      const walletDto = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Treasury Wallet',
        threshold: 2,
        totalSigners: 3,
      };

      await service.registerWallet(walletDto);

      await expect(service.registerWallet(walletDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('trackSignerChange', () => {
    it('should add a signer to wallet', async () => {
      // First register a wallet
      const wallet = await service.registerWallet({
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        threshold: 1,
        totalSigners: 2,
      });

      const signerDto = {
        walletId: wallet.id,
        signer: {
          address: '0x0987654321098765432109876543210987654321',
          name: 'Signer 1',
        },
        action: 'add' as const,
      };

      const result = await service.trackSignerChange(signerDto);

      expect(result.signer).toBeDefined();
      expect(result.signer.address).toBe(signerDto.signer.address);
      expect(result.event.eventType).toBe('signer_added');
      expect(notificationsService.sendAlert).toHaveBeenCalled();
    });

    it('should remove a signer from wallet', async () => {
      const wallet = await service.registerWallet({
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        threshold: 1,
        totalSigners: 2,
      });

      const signerAddress = '0x0987654321098765432109876543210987654321';

      // Add signer first
      await service.trackSignerChange({
        walletId: wallet.id,
        signer: { address: signerAddress, name: 'Signer 1' },
        action: 'add',
      });

      // Remove signer
      const result = await service.trackSignerChange({
        walletId: wallet.id,
        signer: { address: signerAddress },
        action: 'remove',
      });

      expect(result.signer.isActive).toBe(false);
      expect(result.event.eventType).toBe('signer_removed');
    });
  });

  describe('trackThresholdChange', () => {
    it('should track threshold change', async () => {
      const wallet = await service.registerWallet({
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        threshold: 2,
        totalSigners: 3,
      });

      const result = await service.trackThresholdChange({
        walletId: wallet.id,
        previousThreshold: 2,
        newThreshold: 3,
        actor: '0x1111111111111111111111111111111111111111',
      });

      expect(result.wallet.threshold).toBe(3);
      expect(result.event.eventType).toBe('threshold_changed');
      expect(result.event.severity).toBe('critical');
      expect(notificationsService.sendAlert).toHaveBeenCalled();
    });

    it('should throw error for invalid threshold', async () => {
      const wallet = await service.registerWallet({
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        threshold: 2,
        totalSigners: 3,
      });

      await expect(
        service.trackThresholdChange({
          walletId: wallet.id,
          previousThreshold: 2,
          newThreshold: 5,
          actor: '0x1111111111111111111111111111111111111111',
        }),
      ).rejects.toThrow();
    });
  });

  describe('trackApproval', () => {
    it('should track approval for transaction', async () => {
      const wallet = await service.registerWallet({
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        threshold: 2,
        totalSigners: 3,
      });

      const result = await service.trackApproval({
        walletId: wallet.id,
        transactionId: 'tx-123',
        transactionHash: '0xabcd',
        signerId: 'signer-1',
        approvalStatus: 'approved',
      });

      expect(result.approval).toBeDefined();
      expect(result.approval.transactionId).toBe('tx-123');
      expect(result.event.eventType).toBe('approval_given');
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary for wallet', async () => {
      const wallet = await service.registerWallet({
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Wallet',
        threshold: 2,
        totalSigners: 3,
      });

      const summary = await service.getActivitySummary(wallet.id);

      expect(summary).toBeDefined();
      expect(summary.address).toBe(wallet.address);
      expect(summary.currentThreshold).toBe(2);
      expect(summary.totalSigners).toBe(3);
    });

    it('should throw NotFoundException for non-existent wallet', async () => {
      await expect(service.getActivitySummary('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
