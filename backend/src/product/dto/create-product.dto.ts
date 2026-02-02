import { Type } from 'class-transformer';
import { IsString, IsOptional, IsInt, IsNumber, IsDecimal, IsNotEmpty, Min } from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  cod_barra?: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tamaño?: string;

  @IsNotEmpty({ message: 'El precio de venta sin factura es requerido' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 }, 
    { message: 'El precio debe ser un número válido (ej: 50 o 50.55) con máximo 2 decimales' }
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio_venta_sin_factura: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio de venta con factura no puede ser negativo' })
  precio_venta_con_factura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio de compra no puede ser negativo' })
  precio_compra?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio de compra por paquete no puede ser negativo' })
  precio_compra_paquete?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio de venta por paquete sin factura no puede ser negativo' })
  precio_venta_paquete_sin_factura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio de venta por paquete con factura no puede ser negativo' })
  precio_venta_paquete_con_factura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'La cantidad por paquete debe ser al menos 1' })
  cant_por_paquete?: number;

  @IsInt()
  category_id: number;

  @IsOptional()
  @IsInt()
  sub_category_id?: number;
}
