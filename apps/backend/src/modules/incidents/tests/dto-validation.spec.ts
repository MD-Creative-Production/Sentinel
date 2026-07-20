import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { QueryIncidentsDto } from '../dto/query-incidents.dto';
import { UpdatePriorityDto } from '../dto/update-priority.dto';
import { UpdateSeverityDto } from '../dto/update-severity.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';

describe('Incidents DTO validation', () => {
  describe('CreateIncidentDto', () => {
    it('passes with only the required fields', async () => {
      const dto = plainToInstance(CreateIncidentDto, {
        title: 'Suspicious activity',
        description: 'Details of the incident',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('fails when title is missing', async () => {
      const dto = plainToInstance(CreateIncidentDto, { description: 'desc' });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'title')).toBe(true);
    });

    it('fails on an invalid severity value', async () => {
      const dto = plainToInstance(CreateIncidentDto, {
        title: 'T',
        description: 'd',
        severity: 'catastrophic',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'severity')).toBe(true);
    });

    it('fails when sourceAlertIds exceeds the max array size', async () => {
      const dto = plainToInstance(CreateIncidentDto, {
        title: 'T',
        description: 'd',
        sourceAlertIds: Array.from({ length: 51 }, (_, i) => `alert-${i}`),
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'sourceAlertIds')).toBe(true);
    });
  });

  describe('UpdateStatusDto', () => {
    it('fails on an invalid status enum value', async () => {
      const dto = plainToInstance(UpdateStatusDto, { status: 'archived' });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'status')).toBe(true);
    });

    it('passes with a valid status', async () => {
      const dto = plainToInstance(UpdateStatusDto, { status: 'open' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateSeverityDto / UpdatePriorityDto', () => {
    it('rejects an invalid severity', async () => {
      const dto = plainToInstance(UpdateSeverityDto, { severity: 'extreme' });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    });

    it('rejects an invalid priority', async () => {
      const dto = plainToInstance(UpdatePriorityDto, { priority: 'p5' });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    });
  });

  describe('QueryIncidentsDto', () => {
    it('rejects a limit above the maximum', async () => {
      const dto = plainToInstance(QueryIncidentsDto, { limit: 500 });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'limit')).toBe(true);
    });

    it('rejects an invalid sortBy value', async () => {
      const dto = plainToInstance(QueryIncidentsDto, { sortBy: 'title' });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'sortBy')).toBe(true);
    });

    it('passes with no query params (defaults apply)', async () => {
      const dto = plainToInstance(QueryIncidentsDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
