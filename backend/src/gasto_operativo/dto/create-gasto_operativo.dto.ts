import { IsEnum, IsString, IsNumber, IsDate, IsOptional, IsInt, ValidateIf, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaGasto } from '../entities/gasto_operativo.entity';

export class CreateGastoOperativoDto {
  @IsEnum(CategoriaGasto, { message: 'La categoría debe ser COMBUSTIBLE, MANTENIMIENTO o GENERAL' })
  categoria: CategoriaGasto;

  @IsString()
  @MaxLength(200)
  descripcion: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  monto: number;

  @Type(() => Date)
  @IsDate()
  fecha: Date;

  /**
   * Validación condicional: vehiculoId es OBLIGATORIO si la categoría es COMBUSTIBLE o MANTENIMIENTO
   * Para categoría GENERAL, vehiculoId es opcional (puede ser null)
   */
  @ValidateIf(o => o.categoria === CategoriaGasto.COMBUSTIBLE || o.categoria === CategoriaGasto.MANTENIMIENTO)
  @IsInt({ message: 'El vehiculo_id es obligatorio para gastos de COMBUSTIBLE o MANTENIMIENTO' })
  @IsOptional()
  vehiculo_id?: number;
}
