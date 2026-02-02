import { IsInt, IsDate, IsOptional, IsString, IsEnum, IsArray, ValidateNested, ArrayMinSize, Min, IsBoolean } from 'class-validator';
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
  @Type(() => Number)
  @Min(0, { message: 'El monto pagado no puede ser negativo' })
  monto_pagado?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'El descuento no puede ser negativo' })
  descuento?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsBoolean()
  con_factura?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un detalle' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalles: CreateDetalleVentaDto[];
}

