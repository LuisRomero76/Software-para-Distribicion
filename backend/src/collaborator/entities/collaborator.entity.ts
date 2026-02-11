import { VehicleAssignment } from "src/distribution/entities/vehicle-assignment.entity";
import { Cliente } from "src/clientes/entities/cliente.entity";
import { CollaboratorRole } from "src/common/enums/collaborator-role.enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";

@Entity()
export class Collaborator {
  @PrimaryGeneratedColumn()
  collaborator_id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column()
  telefono: string;

  @Column({ type: 'varchar', length: 150, charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: CollaboratorRole, default: CollaboratorRole.PREVENTISTA })
  rol: CollaboratorRole;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => VehicleAssignment, (assignment) => assignment.collaborator, { cascade: true })
  assignments: VehicleAssignment[];

  @OneToMany(() => Cliente, (cliente) => cliente.preventista)
  clientes: Cliente[];
}
