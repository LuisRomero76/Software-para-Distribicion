import { IsDate, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { EstadoRuta } from "../entities/ruta.entity";

export class CreateRutaDto {
    @IsDate()
    @Type(() => Date)
    dia_visita: Date;

    @IsInt()
    cliente_id: number;

    @IsInt()
    collaborator_id: number;

    @IsEnum(EstadoRuta)
    @IsOptional()
    estado?: EstadoRuta;

    @IsString()
    @IsOptional()
    observaciones?: string;
}
