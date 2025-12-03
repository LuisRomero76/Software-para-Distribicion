import { IsInt, IsNotEmpty, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class CreateSubCategoryDto {
    
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim())
    nombre: string;

    @IsInt()
    @IsNotEmpty()
    category_id: number;

}
