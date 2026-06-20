import { Module } from '@nestjs/common';
import { MultisigService } from './multisig.service';
import { MultisigController } from './multisig.controller';
import { NotificationsModule } from '../../notifications/notifications.module';

/**
 * MultisigModule provides multisig wallet monitoring capabilities including:
 * - Signer tracking
 * - Approval monitoring
 * - Threshold change detection
 * - Event logging
 * - Alert generation
 */
@Module({
  imports: [NotificationsModule],
  providers: [MultisigService],
  controllers: [MultisigController],
  exports: [MultisigService],
})
export class MultisigModule {}
