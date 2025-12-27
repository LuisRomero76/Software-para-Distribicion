import { IsInt, Min } from 'class-validator';

export class CreateDetalleVentaDto {
  @IsInt()
  lote_id: number;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;
}
