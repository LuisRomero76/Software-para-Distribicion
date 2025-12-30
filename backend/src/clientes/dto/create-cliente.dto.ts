import { Transform, Type } from "class-transformer";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min, ValidateNested } from "class-validator";
import { Visita } from "src/common/enums/visita.enum";
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
	@Length(0, 20)
	@Transform(({ value }) => value?.toString().trim())
	telefono?: string;

	@IsArray()
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => TelefonoReferenciaDto)
	telefonos_referencia?: TelefonoReferenciaDto[];

	@IsArray()
	@ArrayNotEmpty()
	@ArrayUnique()
	@IsInt({ each: true })
	@Min(1, { each: true })
	@Type(() => Number)
	@Transform(({ value }) => Array.isArray(value) ? value.map(Number) : [Number(value)])
	cliente_categoria_ids: number[];
}
