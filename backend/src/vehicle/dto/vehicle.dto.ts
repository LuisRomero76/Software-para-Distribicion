import { IsString, IsInt, IsNotEmpty, IsPositive, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  placa: string;

  @IsNotEmpty()
  @IsString()
  marca: string;

  @IsNotEmpty()
  @IsString()
  modelo: string;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  año: number;

  @IsOptional()
  @IsNumber()
  capacidad_carga?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  disponible?: boolean;
}