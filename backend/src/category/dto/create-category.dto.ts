import { IsNotEmpty, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    nombre: string;
}
