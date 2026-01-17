import { IsInt, IsNumber, IsDate, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePagoCompraDto {
  @IsInt()
  compra_id: number;

  @IsNumber()
  @Min(0.01, { message: 'El monto del pago debe ser mayor a 0' })
  monto: number;

  @Type(() => Date)
  @IsDate()
  fecha_pago: Date;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
