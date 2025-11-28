import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Admin {

    @PrimaryGeneratedColumn()
    admin_id: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    nombre: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    apellido: string;

    @Column({ type: 'varchar', length: 20, nullable: false })
    telefono: string;

    @Column({ type: 'varchar', length: 150, nullable: false, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 100, nullable: false, select: false })
    password: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

}
