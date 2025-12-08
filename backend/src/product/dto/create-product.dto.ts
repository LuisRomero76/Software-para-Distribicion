import { IsString, IsNumber, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  cod_barra: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  tamaño: string;

  @IsNumber()
  precio_unitario: number;

  @IsOptional()
  @IsDateString()
  fecha_vencimiento?: string;

  @IsInt()
  category_id: number;

  @IsInt()
  sub_category_id: number;
}

export class CreateProductShippingDto {
  @IsInt()
  @Min(1)
  unidades_caja: number;

  @IsNumber()
  @Min(0)
  precio_unidad_envio: number;

  @IsNumber()
  @Min(0)
  precio_caja_envio: number;

  @IsNumber()
  @Min(0)
  flete: number;
}

export class CreateProductWithShippingDto extends CreateProductDto {
  @IsOptional()
  shipping?: CreateProductShippingDto;
}
