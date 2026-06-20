import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MultisigService } from './multisig.service';
import {
  MultisigWalletDto,
  SignerUpdateDto,
  ThresholdChangeDto,
  ApprovalDto,
} from './interfaces/multisig.interface';

/**
 * MultisigController handles HTTP endpoints for multisig monitoring
 */
@Controller('multisig')
export class MultisigController {
  private readonly logger = new Logger(MultisigController.name);

  constructor(private multisigService: MultisigService) {}

  /**
   * POST /multisig/register
   * Register a new multisig wallet for monitoring
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerWallet(@Body() dto: MultisigWalletDto) {
    this.logger.log(`Registering wallet: ${dto.address}`);
    return await this.multisigService.registerWallet(dto);
  }

  /**
   * POST /multisig/signer-change
   * Track a signer addition or removal
   */
  @Post('signer-change')
  @HttpCode(HttpStatus.CREATED)
  async trackSignerChange(@Body() dto: SignerUpdateDto) {
    this.logger.log(
      `Tracking signer ${dto.action}: ${dto.signer.address} in wallet ${dto.walletId}`,
    );
    return await this.multisigService.trackSignerChange(dto);
  }

  /**
   * PUT /multisig/:walletId/threshold
   * Track a threshold change
   */
  @Put(':walletId/threshold')
  @HttpCode(HttpStatus.OK)
  async trackThresholdChange(
    @Param('walletId') walletId: string,
    @Body() dto: Omit<ThresholdChangeDto, 'walletId'>,
  ) {
    this.logger.log(`Tracking threshold change in wallet ${walletId}`);
    return await this.multisigService.trackThresholdChange({
      ...dto,
      walletId,
    });
  }

  /**
   * POST /multisig/approval
   * Track approval activity
   */
  @Post('approval')
  @HttpCode(HttpStatus.CREATED)
  async trackApproval(@Body() dto: ApprovalDto) {
    this.logger.log(`Tracking approval for transaction: ${dto.transactionId}`);
    return await this.multisigService.trackApproval(dto);
  }

  /**
   * GET /multisig/wallets
   * Get all tracked multisig wallets
   */
  @Get('wallets')
  @HttpCode(HttpStatus.OK)
  async getAllWallets() {
    this.logger.log('Fetching all tracked wallets');
    return await this.multisigService.getAllWallets();
  }

  /**
   * GET /multisig/:walletId/activity
   * Get activity summary for a specific wallet
   */
  @Get(':walletId/activity')
  @HttpCode(HttpStatus.OK)
  async getActivitySummary(@Param('walletId') walletId: string) {
    this.logger.log(`Fetching activity summary for wallet: ${walletId}`);
    return await this.multisigService.getActivitySummary(walletId);
  }

  /**
   * GET /multisig/:walletId/details
   * Get detailed information about a wallet
   */
  @Get(':walletId/details')
  @HttpCode(HttpStatus.OK)
  async getWalletDetails(@Param('walletId') walletId: string) {
    this.logger.log(`Fetching wallet details: ${walletId}`);
    return await this.multisigService.getWalletDetails(walletId);
  }
}
