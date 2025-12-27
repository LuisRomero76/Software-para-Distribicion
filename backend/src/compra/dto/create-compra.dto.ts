import { IsInt, IsDate, IsOptional, IsString, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleCompraDto } from 'src/detalle_compra/dto/create-detalle_compra.dto';

export class CreateCompraDto {
  @IsOptional()
  @IsInt()
  proveedor_id?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_compra?: Date;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'La compra debe tener al menos un detalle' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleCompraDto)
  detalles: CreateDetalleCompraDto[];
}
