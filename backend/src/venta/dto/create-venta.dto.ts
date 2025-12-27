import { IsInt, IsDate, IsOptional, IsString, IsEnum, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoVenta } from '../entities/venta.entity';
import { CreateDetalleVentaDto } from 'src/detalle_venta/dto/create-detalle_venta.dto';

export class CreateVentaDto {
  @IsOptional()
  @IsInt()
  cliente_id?: number;

  @Type(() => Date)
  @IsDate()
  fecha_venta: Date;

  @IsEnum(TipoVenta)
  tipo_venta: TipoVenta;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un detalle' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles: CreateDetalleVentaDto[];
}
