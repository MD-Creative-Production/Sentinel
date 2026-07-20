import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { InvitationStatus } from '../enums/invitation-status.enum';

export class InvitationEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  inviteeEmail!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty({ enum: InvitationStatus })
  status!: InvitationStatus;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty()
  invitedById!: string;

  @ApiProperty({ required: false, nullable: true })
  acceptedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  revokedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

/**
 * Data shape for a future email/notification integration. Not sent anywhere yet —
 * assembled by InvitationsService.create() so wiring up delivery later is a
 * matter of passing this to an EmailService, not redesigning the payload.
 */
export class InvitationDeliveryPayload {
  @ApiProperty()
  organizationName!: string;

  @ApiProperty()
  inviterName!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  invitationLink!: string;

  @ApiProperty()
  expiresAt!: Date;
}
