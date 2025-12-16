import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Ruta {
    @PrimaryGeneratedColumn()
    ruta_id: number;

    @Column({ type: 'date', nullable: true })
    dia_visita: Date;



}
