import { Module } from '@nestjs/common';
import { AcknowledgementsModule } from './acknowledgements/acknowledgements.module';

@Module({
  imports: [AcknowledgementsModule],
  controllers: [],
  providers: [],
})
export class AlertsModule {}
