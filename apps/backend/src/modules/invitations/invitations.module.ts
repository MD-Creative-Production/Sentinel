import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvitationsController } from './controllers/invitations.controller';
import { OrgAdminGuard } from './guards/org-admin.guard';
import { InvitationsRepository } from './repositories/invitations.repository';
import { InvitationAcceptanceService } from './services/invitation-acceptance.service';
import { InvitationTokenService } from './services/invitation-token.service';
import { InvitationsService } from './services/invitations.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [InvitationsController],
  providers: [
    InvitationsRepository,
    InvitationTokenService,
    InvitationsService,
    InvitationAcceptanceService,
    OrgAdminGuard,
  ],
  exports: [InvitationsService],
})
export class InvitationsModule {}
