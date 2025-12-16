import { IsString, IsOptional, IsInt } from 'class-validator';

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

  @IsInt()
  category_id: number;

  @IsOptional()
  @IsInt()
  sub_category_id?: number;
}
