import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateIngresoCategoriaDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La descripción no puede exceder 255 caracteres' })
  descripcion?: string;
}
