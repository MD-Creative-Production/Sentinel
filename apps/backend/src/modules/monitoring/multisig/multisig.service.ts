import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  MultisigWalletDto,
  SignerUpdateDto,
  ThresholdChangeDto,
  ApprovalDto,
  MultisigEventDto,
  MultisigAlertPayload,
  MultisigActivityResponse,
} from './interfaces/multisig.interface';

/**
 * MultisigService handles monitoring and tracking of multisig wallet activities.
 * Key responsibilities:
 * - Signer tracking (additions and removals)
 * - Approval monitoring
 * - Threshold change detection
 * - Alert generation on significant changes
 */
@Injectable()
export class MultisigService {
  private readonly logger = new Logger(MultisigService.name);
  private prisma: PrismaClient;

  constructor(private notificationsService: NotificationsService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Register a multisig wallet for monitoring
   */
  async registerWallet(dto: MultisigWalletDto) {
    try {
      const existingWallet = await this.prisma.multisigWallet.findUnique({
        where: { address: dto.address },
      });

      if (existingWallet) {
        throw new ConflictException(`Multisig wallet ${dto.address} is already registered`);
      }

      const wallet = await this.prisma.multisigWallet.create({
        data: {
          address: dto.address,
          name: dto.name,
          description: dto.description,
          threshold: dto.threshold,
          totalSigners: dto.totalSigners,
          organizationName: dto.organizationName,
        },
        include: { signers: true, events: true },
      });

      this.logger.log(`Registered multisig wallet: ${dto.address}`);
      return wallet;
    } catch (error) {
      this.logger.error(`Failed to register wallet: ${error}`);
      throw error;
    }
  }

  /**
   * Track a signer addition or removal
   */
  async trackSignerChange(dto: SignerUpdateDto) {
    const wallet = await this.validateWallet(dto.walletId);

    try {
      if (dto.action === 'add') {
        return await this.addSigner(wallet, dto);
      } else if (dto.action === 'remove') {
        return await this.removeSigner(wallet, dto);
      }

      throw new BadRequestException(`Invalid action: ${dto.action}`);
    } catch (error) {
      this.logger.error(`Signer change failed: ${error}`);
      throw error;
    }
  }

  /**
   * Track threshold change
   */
  async trackThresholdChange(dto: ThresholdChangeDto) {
    const wallet = await this.validateWallet(dto.walletId);

    if (dto.newThreshold < 1 || dto.newThreshold > wallet.totalSigners) {
      throw new BadRequestException(
        `Invalid threshold: must be between 1 and ${wallet.totalSigners}`,
      );
    }

    try {
      // Update wallet threshold
      const updatedWallet = await this.prisma.multisigWallet.update({
        where: { id: dto.walletId },
        data: { threshold: dto.newThreshold },
      });

      // Create event record
      const event = await this.createEvent({
        walletId: dto.walletId,
        eventType: 'threshold_changed',
        actor: dto.actor,
        previousValue: String(dto.previousThreshold),
        newValue: String(dto.newThreshold),
        severity: 'critical',
      });

      // Send alert
      await this.sendAlert({
        walletAddress: wallet.address,
        walletName: wallet.name,
        eventType: 'threshold_changed',
        severity: 'critical',
        message: `Multisig threshold changed from ${dto.previousThreshold} to ${dto.newThreshold}`,
        actor: dto.actor,
        details: {
          previousThreshold: dto.previousThreshold,
          newThreshold: dto.newThreshold,
        },
        timestamp: new Date(),
      });

      this.logger.log(
        `Threshold updated for wallet ${wallet.address}: ${dto.previousThreshold} -> ${dto.newThreshold}`,
      );

      return { wallet: updatedWallet, event };
    } catch (error) {
      this.logger.error(`Threshold change tracking failed: ${error}`);
      throw error;
    }
  }

  /**
   * Track approval activity
   */
  async trackApproval(dto: ApprovalDto) {
    const wallet = await this.validateWallet(dto.walletId);

    try {
      const approval = await this.prisma.multisigApproval.create({
        data: {
          walletId: dto.walletId,
          transactionId: dto.transactionId,
          transactionHash: dto.transactionHash,
          signerId: dto.signerId,
          approvalStatus: dto.approvalStatus,
          metadata: dto.metadata,
          approvedAt: dto.approvalStatus === 'approved' ? new Date() : undefined,
        },
        include: { signer: true },
      });

      // Create event based on approval status
      const eventType = dto.approvalStatus === 'approved' ? 'approval_given' : 'approval_requested';

      const severity = dto.approvalStatus === 'rejected' ? 'warning' : 'info';

      const event = await this.createEvent({
        walletId: dto.walletId,
        eventType,
        actor: dto.signerId,
        transactionHash: dto.transactionHash,
        severity,
      });

      // Send alert if approval was rejected
      if (dto.approvalStatus === 'rejected') {
        await this.sendAlert({
          walletAddress: wallet.address,
          walletName: wallet.name,
          eventType: 'approval_rejected',
          severity: 'warning',
          message: `Approval rejected for transaction ${dto.transactionId}`,
          actor: dto.signerId,
          details: { transactionHash: dto.transactionHash },
          timestamp: new Date(),
        });
      }

      this.logger.log(
        `Approval tracked for transaction ${dto.transactionId}: ${dto.approvalStatus}`,
      );

      return { approval, event };
    } catch (error) {
      this.logger.error(`Approval tracking failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get multisig activity summary
   */
  async getActivitySummary(walletId: string): Promise<MultisigActivityResponse> {
    const wallet = await this.validateWallet(walletId);

    try {
      const activeSigners = await this.prisma.signer.count({
        where: { walletId, isActive: true },
      });

      const recentEvents = await this.prisma.multisigEvent.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const pendingApprovals = await this.prisma.multisigApproval.findMany({
        where: { walletId, approvalStatus: 'pending' },
        include: { signer: true },
        orderBy: { createdAt: 'desc' },
      });

      return {
        walletId: wallet.id,
        address: wallet.address,
        name: wallet.name,
        currentThreshold: wallet.threshold,
        totalSigners: wallet.totalSigners,
        activeSigners,
        recentActivity: recentEvents,
        pendingApprovals,
      };
    } catch (error) {
      this.logger.error(`Failed to get activity summary: ${error}`);
      throw error;
    }
  }

  /**
   * Get all tracked wallets
   */
  async getAllWallets() {
    try {
      return await this.prisma.multisigWallet.findMany({
        where: { isActive: true },
        include: {
          signers: { where: { isActive: true } },
          events: { take: 5, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get wallets: ${error}`);
      throw error;
    }
  }

  /**
   * Get wallet details with full activity
   */
  async getWalletDetails(walletId: string) {
    const wallet = await this.validateWallet(walletId);

    try {
      const signers = await this.prisma.signer.findMany({
        where: { walletId },
      });

      const recentEvents = await this.prisma.multisigEvent.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        wallet,
        signers,
        eventHistory: recentEvents,
      };
    } catch (error) {
      this.logger.error(`Failed to get wallet details: ${error}`);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async validateWallet(walletId: string) {
    const wallet = await this.prisma.multisigWallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException(`Multisig wallet ${walletId} not found`);
    }

    return wallet;
  }

  private async addSigner(wallet: any, dto: SignerUpdateDto) {
    // Check if signer already exists
    const existingSigner = await this.prisma.signer.findUnique({
      where: { walletId_address: { walletId: dto.walletId, address: dto.signer.address } },
    });

    if (existingSigner) {
      if (existingSigner.isActive) {
        throw new ConflictException(`Signer ${dto.signer.address} is already active`);
      }
      // Re-activate removed signer
      return await this.prisma.signer.update({
        where: { id: existingSigner.id },
        data: { isActive: true, removedAt: null },
      });
    }

    const newSigner = await this.prisma.signer.create({
      data: {
        walletId: dto.walletId,
        address: dto.signer.address,
        name: dto.signer.name,
        isActive: true,
      },
    });

    // Create event
    const event = await this.createEvent({
      walletId: dto.walletId,
      eventType: 'signer_added',
      actor: dto.signer.address,
      newValue: dto.signer.address,
      severity: 'warning',
    });

    // Send alert
    await this.sendAlert({
      walletAddress: wallet.address,
      walletName: wallet.name,
      eventType: 'signer_added',
      severity: 'warning',
      message: `New signer added: ${dto.signer.name || dto.signer.address}`,
      actor: dto.signer.address,
      details: { signerAddress: dto.signer.address },
      timestamp: new Date(),
    });

    this.logger.log(`Signer added to wallet ${wallet.address}: ${dto.signer.address}`);

    return { signer: newSigner, event };
  }

  private async removeSigner(wallet: any, dto: SignerUpdateDto) {
    const signer = await this.prisma.signer.findUnique({
      where: { walletId_address: { walletId: dto.walletId, address: dto.signer.address } },
    });

    if (!signer) {
      throw new NotFoundException(`Signer ${dto.signer.address} not found in wallet`);
    }

    if (!signer.isActive) {
      throw new ConflictException(`Signer ${dto.signer.address} is already inactive`);
    }

    // Mark signer as removed
    const updatedSigner = await this.prisma.signer.update({
      where: { id: signer.id },
      data: { isActive: false, removedAt: new Date() },
    });

    // Create event
    const event = await this.createEvent({
      walletId: dto.walletId,
      eventType: 'signer_removed',
      actor: dto.signer.address,
      previousValue: dto.signer.address,
      severity: 'critical',
    });

    // Send alert
    await this.sendAlert({
      walletAddress: wallet.address,
      walletName: wallet.name,
      eventType: 'signer_removed',
      severity: 'critical',
      message: `Signer removed: ${dto.signer.name || dto.signer.address}`,
      actor: dto.signer.address,
      details: { signerAddress: dto.signer.address },
      timestamp: new Date(),
    });

    this.logger.log(`Signer removed from wallet ${wallet.address}: ${dto.signer.address}`);

    return { signer: updatedSigner, event };
  }

  private async createEvent(dto: MultisigEventDto) {
    return await this.prisma.multisigEvent.create({
      data: {
        walletId: dto.walletId,
        eventType: dto.eventType,
        actor: dto.actor,
        previousValue: dto.previousValue,
        newValue: dto.newValue,
        transactionHash: dto.transactionHash,
        metadata: dto.metadata,
        severity: dto.severity || 'info',
      },
    });
  }

  private async sendAlert(payload: MultisigAlertPayload) {
    try {
      await this.notificationsService.sendAlert({
        title: `Multisig Alert: ${payload.eventType}`,
        message: payload.message,
        severity: payload.severity,
        source: 'multisig-monitoring',
        timestamp: payload.timestamp.toISOString(),
        metadata: {
          walletAddress: payload.walletAddress,
          walletName: payload.walletName,
          eventType: payload.eventType,
          actor: payload.actor,
          details: payload.details,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send alert: ${error}`);
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
