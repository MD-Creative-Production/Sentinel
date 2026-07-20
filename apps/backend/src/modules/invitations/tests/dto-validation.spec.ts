import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { QueryInvitationsDto } from '../dto/query-invitations.dto';

describe('Invitations DTO validation', () => {
  describe('CreateInvitationDto', () => {
    it('passes with valid fields', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        organizationId: 'org-1',
        inviteeEmail: 'new.member@example.com',
        role: Role.ANALYST,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails on an invalid email', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        organizationId: 'org-1',
        inviteeEmail: 'not-an-email',
        role: Role.ANALYST,
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'inviteeEmail')).toBe(true);
    });

    it('fails on an invalid role', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        organizationId: 'org-1',
        inviteeEmail: 'new.member@example.com',
        role: 'owner',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'role')).toBe(true);
    });

    it('fails when organizationId is missing', async () => {
      const dto = plainToInstance(CreateInvitationDto, {
        inviteeEmail: 'new.member@example.com',
        role: Role.ANALYST,
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'organizationId')).toBe(true);
    });
  });

  describe('AcceptInvitationDto', () => {
    it('passes with a valid token and email', async () => {
      const dto = plainToInstance(AcceptInvitationDto, {
        token: 'a'.repeat(64),
        email: 'new.member@example.com',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails when the token is too short', async () => {
      const dto = plainToInstance(AcceptInvitationDto, {
        token: 'short',
        email: 'new.member@example.com',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'token')).toBe(true);
    });
  });

  describe('QueryInvitationsDto', () => {
    it('fails without organizationId', async () => {
      const dto = plainToInstance(QueryInvitationsDto, {});
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'organizationId')).toBe(true);
    });

    it('rejects an invalid status', async () => {
      const dto = plainToInstance(QueryInvitationsDto, {
        organizationId: 'org-1',
        status: 'archived',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'status')).toBe(true);
    });

    it('rejects a limit above the maximum', async () => {
      const dto = plainToInstance(QueryInvitationsDto, { organizationId: 'org-1', limit: 500 });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'limit')).toBe(true);
    });

    it('passes with just organizationId (defaults apply)', async () => {
      const dto = plainToInstance(QueryInvitationsDto, { organizationId: 'org-1' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
