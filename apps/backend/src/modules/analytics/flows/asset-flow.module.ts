import { Module } from '@nestjs/common';
import { AssetFlowService } from './asset-flow.service';

@Module({
  providers: [AssetFlowService],
  exports: [AssetFlowService],
})
export class AssetFlowModule {}
