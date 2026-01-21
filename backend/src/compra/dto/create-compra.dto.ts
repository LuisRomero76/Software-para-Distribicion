import { IsInt, IsDate, IsOptional, IsString, IsArray, ValidateNested, ArrayMinSize, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleCompraDto } from 'src/detalle_compra/dto/create-detalle_compra.dto';
import { TipoCompra } from '../entities/compra.entity';

export class CreateCompraDto {
  @IsOptional()
  @IsInt()
  proveedor_id?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_compra?: Date;

  @IsEnum(TipoCompra)
  tipo_compra: TipoCompra;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'El descuento no puede ser negativo' })
  descuento?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'El monto pagado no puede ser negativo' })
  monto_pagado?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'La compra debe tener al menos un detalle' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleCompraDto)
  detalles: CreateDetalleCompraDto[];
}
