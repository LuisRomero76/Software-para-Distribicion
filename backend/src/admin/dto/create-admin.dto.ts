import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class CreateAdminDto {

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    nombre: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    apellido: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    telefono: string;

    @IsEmail()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    email: string;

    @IsString()
    @MinLength(6)
    @Transform(({ value }) => value.trim())
    password: string;

}
