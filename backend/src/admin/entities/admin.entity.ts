import { Role } from "src/common/enums/rol.enum";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Admin {

    @PrimaryGeneratedColumn()
    admin_id: number;

    @Column({ length: 50, nullable: false })
    name: string;

    @Column({ type: 'enum', default: Role.ADMINISTRADOR, enum: Role })
    rol: Role

    @Column({ type: 'varchar', length: 150, nullable: false, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 100, nullable: false, select: false })
    password: string;

}
