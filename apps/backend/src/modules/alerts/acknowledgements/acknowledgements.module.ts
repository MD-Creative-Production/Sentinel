import { Module } from '@nestjs/common';
import { AcknowledgementsService } from './acknowledgements.service';
import { AcknowledgementsController } from './acknowledgements.controller';

@Module({
  controllers: [AcknowledgementsController],
  providers: [AcknowledgementsService],
  exports: [AcknowledgementsService],
})
export class AcknowledgementsModule {}
