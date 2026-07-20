import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateIncidentDto } from './create-incident.dto';

/**
 * Update excludes severity/priority — those go through their own
 * dedicated endpoints so each field's audit trail stays unambiguous.
 */
export class UpdateIncidentDto extends PartialType(
  OmitType(CreateIncidentDto, ['severity', 'priority', 'assignedUserId'] as const),
) {}
