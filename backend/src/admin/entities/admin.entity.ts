import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Admin {

    @PrimaryGeneratedColumn()
    admin_id: number;

    @Column({ length: 50, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    password: string;

}
