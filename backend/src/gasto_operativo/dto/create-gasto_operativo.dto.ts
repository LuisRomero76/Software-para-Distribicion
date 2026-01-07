import { IsEnum, IsString, IsNumber, IsOptional, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaGasto } from '../entities/gasto_operativo.entity';

export class CreateGastoOperativoDto {
  @IsOptional()
  @IsEnum(CategoriaGasto, { message: 'La categoría debe ser COMBUSTIBLE, MANTENIMIENTO o GENERAL' })
  categoria?: CategoriaGasto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;

  @IsString()
  @MaxLength(200)
  descripcion: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  monto: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehiculo_id?: number;
}
