import { Module } from '@nestjs/common';
import { RbacGuard } from './guards/rbac.guard';

@Module({
  providers: [RbacGuard],
  exports: [RbacGuard],
})
export class RbacModule {}
