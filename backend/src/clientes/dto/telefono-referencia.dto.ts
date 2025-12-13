import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class TelefonoReferenciaDto {

    @IsString()
    @IsNotEmpty()
    @Length(1, 20)
    @Transform(({ value }) => value?.toString().trim())
    numero: string;

    @IsString()
    @IsOptional()
    @Length(0, 100)
    @Transform(({ value }) => value?.trim())
    nombre_contacto?: string;
}
