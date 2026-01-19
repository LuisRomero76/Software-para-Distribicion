import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class ChangePasswordDto {

    @IsEmail({}, { message: 'El email debe ser válido' })
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    email: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    currentPassword: string;

    @IsString()
    @MinLength(6)
    @Transform(({ value }) => value.trim())
    newPassword: string;

}
