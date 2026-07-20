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
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { AssignOwnerDto } from '../dto/assign-owner.dto';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { QueryIncidentsDto } from '../dto/query-incidents.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { UpdatePriorityDto } from '../dto/update-priority.dto';
import { UpdateSeverityDto } from '../dto/update-severity.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { IncidentEntity } from '../entities/incident.entity';
import { IncidentAssignmentService } from '../services/incident-assignment.service';
import { IncidentStatusService } from '../services/incident-status.service';
import { IncidentsService } from '../services/incidents.service';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly statusService: IncidentStatusService,
    private readonly assignmentService: IncidentAssignmentService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiResponse({ status: 201, type: IncidentEntity })
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.incidentsService.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ANALYST, Role.VIEWER)
  @ApiOperation({ summary: 'List incidents with pagination, filtering, sorting and search' })
  findAll(@Query() query: QueryIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ANALYST, Role.VIEWER)
  @ApiOperation({ summary: 'Retrieve full incident details, including audit trail' })
  @ApiResponse({ status: 200, type: IncidentEntity })
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Update incident fields (title, description, category, tags, etc.)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Transition incident lifecycle status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.statusService.transition(id, dto.status, user, dto.reason);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Assign, reassign, or remove the incident owner' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignOwnerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentService.assign(id, dto.assignedUserId, user);
  }

  @Patch(':id/severity')
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Update incident severity' })
  updateSeverity(
    @Param('id') id: string,
    @Body() dto: UpdateSeverityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.updateSeverity(id, dto.severity, user);
  }

  @Patch(':id/priority')
  @Roles(Role.ADMIN, Role.ANALYST)
  @ApiOperation({ summary: 'Update incident priority' })
  updatePriority(
    @Param('id') id: string,
    @Body() dto: UpdatePriorityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidentsService.updatePriority(id, dto.priority, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Archive (soft delete) an incident' })
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.incidentsService.archive(id, user);
  }
}
