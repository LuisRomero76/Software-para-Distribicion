import { IsInt, IsNotEmpty, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateVehicleAssignmentDto {
  @IsNotEmpty()
  @IsInt()
  vehicle_id: number;

  @IsNotEmpty()
  @IsInt()
  collaborator_id: number;

  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @IsOptional()
  @IsIn(['activo', 'finalizado', 'cancelado'])
  estado?: string;
}