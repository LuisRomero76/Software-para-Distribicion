import { IsEnum } from "class-validator";
import { EstadoRuta } from "../entities/ruta.entity";

export class UpdateEstadoRutaDto {
    @IsEnum(EstadoRuta)
    estado: EstadoRuta;
}
