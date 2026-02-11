import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CollaboratorRole } from 'src/common/enums/collaborator-role.enum';

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

  @IsNotEmpty()
  @IsEnum(CollaboratorRole, { message: 'El rol debe ser preventista o distribuidor' })
  rol: CollaboratorRole;
}
