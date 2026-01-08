import { IsString, IsNumber, IsOptional, IsEnum, MaxLength, Min } from 'class-validator';
import { TipoIngreso } from '../entities/ingreso.entity';

export class CreateIngresoDto {
  @IsOptional()
  @IsEnum(TipoIngreso, { message: 'El tipo debe ser VENTA, COMPRA, PRESTAMO, DEVOLUCION u OTRO' })
  tipo?: TipoIngreso;

  @IsOptional()
  @IsNumber({}, { message: 'El categoria_id debe ser un número' })
  categoria_id?: number;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(200, { message: 'La descripción no puede exceder 200 caracteres' })
  descripcion: string;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0, { message: 'El monto debe ser mayor o igual a 0' })
  monto: number;

  @IsOptional()
  @IsNumber({}, { message: 'El referencia_id debe ser un número' })
  referencia_id?: number;
}
