import { IsInt, IsNumber, IsOptional, IsDate, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ModoCompra {
  UNIDAD = 'unidad',
  PAQUETE = 'paquete',
}

export class CreateDetalleCompraDto {
  @IsInt()
  product_id: number;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  precio_unitario: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_vencimiento?: Date;

  @IsOptional()
  @IsEnum(ModoCompra)
  modo?: ModoCompra;
}
