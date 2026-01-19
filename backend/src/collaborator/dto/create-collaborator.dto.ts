import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCollaboratorDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  apellido: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
