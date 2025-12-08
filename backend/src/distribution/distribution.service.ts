import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleAssignment } from './entities/vehicle-assignment.entity';
import { CreateVehicleAssignmentDto } from './dto/vehicle-assignment.dto';
import { VehicleService } from '../vehicle/vehicle.service';
import { UpdateVehicleAssignmentDto } from './dto/update-distribution.dto';

@Injectable()
export class DistributionService {
  constructor(
    @InjectRepository(VehicleAssignment)
    private assignmentRepository: Repository<VehicleAssignment>,
    private vehicleService: VehicleService,
  ) {}

  async createAssignment(
    createAssignmentDto: CreateVehicleAssignmentDto,
  ): Promise<VehicleAssignment> {
    const { vehicle_id, collaborator_id, fecha_inicio, fecha_fin } = createAssignmentDto;

    // Validar que la fecha de fin sea posterior a la de inicio
    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar que el vehículo existe
    await this.vehicleService.findOne(vehicle_id);

    // Verificar conflictos de asignación (mismo vehículo en el mismo período)
    const conflict = await this.assignmentRepository.findOne({
      where: {
        vehicle_id,
        estado: 'activo',
      },
    });

    if (conflict) {
      throw new BadRequestException('Este vehículo ya tiene una asignación activa');
    }

    const assignment = this.assignmentRepository.create(createAssignmentDto);
    return this.assignmentRepository.save(assignment);
  }

  async findAllAssignments(): Promise<VehicleAssignment[]> {
    return this.assignmentRepository.find({
      relations: ['vehicle', 'collaborator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAssignmentById(id: number): Promise<VehicleAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { assignment_id: id },
      relations: ['vehicle', 'collaborator'],
    });
    if (!assignment) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }
    return assignment;
  }

  async findAssignmentsByCollaborator(collaborator_id: number): Promise<VehicleAssignment[]> {
    return this.assignmentRepository.find({
      where: { collaborator_id },
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAssignmentsByVehicle(vehicle_id: number): Promise<VehicleAssignment[]> {
    return this.assignmentRepository.find({
      where: { vehicle_id },
      relations: ['collaborator'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateAssignment(
    id: number,
    updateAssignmentDto: UpdateVehicleAssignmentDto,
  ): Promise<VehicleAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { assignment_id: id }
    });
    
    if (!assignment) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    if (updateAssignmentDto.vehicle_id && updateAssignmentDto.vehicle_id !== assignment.vehicle_id) {
      await this.vehicleService.findOne(updateAssignmentDto.vehicle_id);

      const nuevoEstado = updateAssignmentDto.estado || assignment.estado;
      if (nuevoEstado === 'activo') {
        const conflict = await this.assignmentRepository.findOne({
          where: {
            vehicle_id: updateAssignmentDto.vehicle_id,
            estado: 'activo',
          },
        });

        if (conflict && conflict.assignment_id !== id) {
          throw new BadRequestException('Este vehículo ya tiene una asignación activa');
        }
      }
    }

    const fechaInicio = updateAssignmentDto.fecha_inicio ? new Date(updateAssignmentDto.fecha_inicio) : new Date(assignment.fecha_inicio);
    const fechaFin = updateAssignmentDto.fecha_fin ? new Date(updateAssignmentDto.fecha_fin) : new Date(assignment.fecha_fin);

    if (fechaFin <= fechaInicio) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    
    Object.assign(assignment, updateAssignmentDto);
    
    // Guardar sin relaciones para evitar que TypeORM sobrescriba los IDs
    const saved = await this.assignmentRepository.save(assignment);
    
    // Recargar con relaciones para devolver datos completos al frontend
    const reloaded = await this.assignmentRepository.findOne({
      where: { assignment_id: saved.assignment_id },
      relations: ['vehicle', 'collaborator']
    });
    
    if (!reloaded) {
      throw new NotFoundException(`No se pudo recargar la asignación con ID ${saved.assignment_id}`);
    }
    return reloaded;
  }

  async removeAssignment(id: number): Promise<void> {
    const assignment = await this.findAssignmentById(id);
    await this.assignmentRepository.remove(assignment);
  }

  async getActiveAssignments(): Promise<VehicleAssignment[]> {
    return this.assignmentRepository.find({
      where: { estado: 'activo' },
      relations: ['vehicle', 'collaborator'],
    });
  }
}
