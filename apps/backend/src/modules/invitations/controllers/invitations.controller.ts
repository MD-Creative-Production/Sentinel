import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { QueryInvitationsDto } from '../dto/query-invitations.dto';
import { ResendInvitationDto } from '../dto/resend-invitation.dto';
import { InvitationEntity } from '../entities/invitation.entity';
import { OrgAdminGuard } from '../guards/org-admin.guard';
import { InvitationAcceptanceService } from '../services/invitation-acceptance.service';
import { InvitationsService } from '../services/invitations.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly acceptanceService: InvitationAcceptanceService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  @ApiOperation({ summary: 'Invite a new member into an organization' })
  @ApiResponse({ status: 201, type: InvitationEntity })
  create(@Body() dto: CreateInvitationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.invitationsService.create(dto, user);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  @ApiOperation({
    summary: 'List invitations for an organization with pagination, filtering, and sorting',
  })
  findAll(@Query() query: QueryInvitationsDto) {
    return this.invitationsService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  @ApiOperation({ summary: 'Retrieve an invitation, including its audit trail' })
  @ApiResponse({ status: 200, type: InvitationEntity })
  findOne(@Param('id') id: string) {
    return this.invitationsService.findOne(id);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept an invitation using its token, creating an account if needed' })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.acceptanceService.accept(dto);
  }

  @Post(':id/resend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  @ApiOperation({ summary: 'Reissue an invitation token and expiration' })
  resend(
    @Param('id') id: string,
    @Body() dto: ResendInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationsService.resend(id, user, dto.reason);
  }

  @Patch(':id/revoke')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  revoke(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invitationsService.revoke(id, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OrgAdminGuard)
  @ApiOperation({ summary: 'Permanently delete an invitation record' })
  remove(@Param('id') id: string) {
    return this.invitationsService.remove(id);
  }
}
