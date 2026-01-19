import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {

    @IsEmail({}, { message: 'El email debe ser válido' })
    email: string;
    
    @IsString()
    @MinLength(6)
    @Transform(({ value }) => value.trim())
    password: string;
}