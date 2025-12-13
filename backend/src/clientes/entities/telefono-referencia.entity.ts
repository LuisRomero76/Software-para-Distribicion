import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cliente } from "./cliente.entity";

@Entity()
export class TelefonoReferencia {

    @PrimaryGeneratedColumn()
    telefono_referencia_id: number;

    @Column({ type: 'varchar', length: 20 })
    numero: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nombre_contacto?: string;

    @Column({ type: 'int' })
    cliente_id: number;

    @ManyToOne(() => Cliente, cliente => cliente.telefonos_referencia, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'cliente_id' })
    cliente: Cliente;
}
