import { IsInt, IsDecimal, IsDate, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePagoDto {
  @IsInt()
  venta_id: number;

  @Type(() => Number)
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @Type(() => Date)
  @IsDate()
  fecha_pago: Date;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
