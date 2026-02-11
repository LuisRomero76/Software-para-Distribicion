import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, ValidateNested, IsArray } from "class-validator";
import { Visita } from "src/common/enums/visita.enum";
import { DiaVisita } from "src/common/enums/dia-visita.enum";
import { TelefonoReferenciaDto } from "./telefono-referencia.dto";

export class CreateClienteDto {

	@IsString()
	@IsNotEmpty()
	@Length(1, 100)
	@Transform(({ value }) => value.trim())
	sub_canal: string;

	@IsOptional()
	@IsEnum(Visita)
	visita?: Visita;

	@IsOptional()
	@IsEnum(DiaVisita)
	dia_visita?: DiaVisita;

	@IsOptional()
	@IsInt()
	nit_ci?: number;

	@IsString()
	@IsNotEmpty()
	@Length(1, 100)
	@Transform(({ value }) => value.trim())
	nombre: string;

	@IsString()
	@IsNotEmpty()
	@Length(1, 200)
	@Transform(({ value }) => value.trim())
	direccion: string;

	@IsString()
	@IsOptional()
	@Length(0, 100)
	@Transform(({ value }) => value?.trim())
	ciudad?: string;

	@IsString()
	@IsOptional()
	@Length(0, 200)
	@Transform(({ value }) => value?.trim())
	coordenadas?: string;

	@IsString()
	@IsOptional()
	@Length(0, 50)
	@Transform(({ value }) => value?.toString().trim())
	telefono?: string;

	@IsArray()
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => TelefonoReferenciaDto)
	telefonos_referencia?: TelefonoReferenciaDto[];

	@IsNotEmpty()
	@IsInt()
	@Type(() => Number)
	preventista_id: number;
}
