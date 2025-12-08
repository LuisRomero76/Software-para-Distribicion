import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsDateString, IsOptional, IsIn } from 'class-validator';
import { CreateVehicleAssignmentDto } from './vehicle-assignment.dto';

export class UpdateVehicleAssignmentDto extends PartialType(CreateVehicleAssignmentDto) {
  @IsOptional()
  @IsInt()
  vehicle_id?: number;

  @IsOptional()
  @IsInt()
  collaborator_id?: number;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @IsOptional()
  @IsIn(['activo', 'finalizado', 'cancelado'])
  estado?: string;
}
