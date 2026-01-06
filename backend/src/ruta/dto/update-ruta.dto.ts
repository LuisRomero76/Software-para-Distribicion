import { IsDate, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { EstadoRuta } from "../entities/ruta.entity";

export class UpdateRutaDto {
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    dia_visita?: Date;

    @IsOptional()
    @IsInt()
    cliente_id?: number;

    @IsOptional()
    @IsInt()
    collaborator_id?: number;

    @IsOptional()
    @IsEnum(EstadoRuta)
    estado?: EstadoRuta;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
