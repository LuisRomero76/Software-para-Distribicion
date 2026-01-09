import { IsInt, Min, IsOptional, IsEnum } from 'class-validator';

export enum ModoVenta {
  UNIDAD = 'unidad',
  PAQUETE = 'paquete',
}

export class CreateDetalleVentaDto {
  @IsInt()
  lote_id: number;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @IsOptional()
  @IsEnum(ModoVenta)
  modo?: ModoVenta;
}
