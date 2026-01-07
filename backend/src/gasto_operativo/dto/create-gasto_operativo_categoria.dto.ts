import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateGastoOperativoCategoriasDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
