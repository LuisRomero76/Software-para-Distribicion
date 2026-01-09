import { IsEnum, IsString, IsNumber, IsOptional, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaGasto, TipoEgreso } from '../entities/gasto_operativo.entity';

export class CreateGastoOperativoDto {
  @IsOptional()
  @IsEnum(TipoEgreso, { message: 'El tipo debe ser COMPRA, COMBUSTIBLE, MANTENIMIENTO, OPERATIVO, NOMINA u OTRO' })
  tipo?: TipoEgreso;

  @IsOptional()
  @IsEnum(CategoriaGasto, { message: 'La categoría debe ser COMBUSTIBLE, MANTENIMIENTO o GENERAL' })
  categoria?: CategoriaGasto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoria_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  monto: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehiculo_id?: number;
}
