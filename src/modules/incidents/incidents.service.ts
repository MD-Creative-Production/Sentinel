import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities';
import { CreateIncidentDto, UpdateIncidentDto } from './dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentRepository.create(createIncidentDto);
    return this.incidentRepository.save(incident);
  }

  async findAll(): Promise<Incident[]> {
    return this.incidentRepository.find();
  }

  async findOne(id: number): Promise<Incident> {
    return this.incidentRepository.findOne({ where: { id } });
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    await this.incidentRepository.update(id, updateIncidentDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.incidentRepository.delete(id);
  }
}