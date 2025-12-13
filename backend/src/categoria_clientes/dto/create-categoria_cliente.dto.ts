import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCategoriaClienteDto {

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    nombre: string;

}
