import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from './entities/collaborator.entity';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { UpdateCollaboratorDto } from './dto/update-collaborator.dto';

@Injectable()
export class CollaboratorService {
  constructor(
    @InjectRepository(Collaborator)
    private collaboratorRepository: Repository<Collaborator>,
  ) {}

  async create(createCollaboratorDto: CreateCollaboratorDto): Promise<Collaborator> {
    const collaborator = this.collaboratorRepository.create(createCollaboratorDto);
    return this.collaboratorRepository.save(collaborator);
  }

  async findAll(): Promise<Collaborator[]> {
    return this.collaboratorRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['assignments'],
    });
  }

  async findOne(id: number): Promise<Collaborator> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { collaborator_id: id },
      relations: ['assignments', 'clientes'],
    });
    if (!collaborator) {
      throw new NotFoundException(`Colaborador con ID ${id} no encontrado`);
    }
    return collaborator;
  }

  async update(id: number, updateCollaboratorDto: UpdateCollaboratorDto): Promise<Collaborator> {
    const collaborator = await this.findOne(id);
    Object.assign(collaborator, updateCollaboratorDto);
    return this.collaboratorRepository.save(collaborator);
  }

  async remove(id: number): Promise<{ message: string }> {
    const collaborator = await this.findOne(id);
    await this.collaboratorRepository.remove(collaborator);
    return { message: 'Colaborador eliminado exitosamente' };
  }
}
