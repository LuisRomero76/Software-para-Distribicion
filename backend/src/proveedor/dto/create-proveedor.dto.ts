import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nit_ci?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;
}
