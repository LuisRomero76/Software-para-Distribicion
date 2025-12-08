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

  @Column()
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => VehicleAssignment, (assignment) => assignment.collaborator, { cascade: true })
  assignments: VehicleAssignment[];
}
