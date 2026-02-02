import { IsNotEmpty, IsNumber, IsDateString, IsString, IsEnum, IsOptional, Min } from 'class-validator';

export class AjusteInventarioDto {
  @IsNotEmpty()
  @IsNumber()
  producto_id: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cantidad: number;

  @IsNotEmpty()
  @IsEnum(['unidad', 'paquete'])
  modo: 'unidad' | 'paquete';

  @IsNotEmpty()
  @IsDateString()
  fecha_vencimiento: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
