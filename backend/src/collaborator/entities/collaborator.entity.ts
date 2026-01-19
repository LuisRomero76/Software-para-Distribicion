import { VehicleAssignment } from "src/distribution/entities/vehicle-assignment.entity";
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

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => VehicleAssignment, (assignment) => assignment.collaborator, { cascade: true })
  assignments: VehicleAssignment[];
}
