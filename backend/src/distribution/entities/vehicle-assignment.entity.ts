import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Collaborator } from '../../collaborator/entities/collaborator.entity';

@Entity()
export class VehicleAssignment {
  @PrimaryGeneratedColumn()
  assignment_id: number;

  @Column()
  vehicle_id: number;

  @Column()
  collaborator_id: number;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ default: 'activo' })
  estado: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => Collaborator, (collaborator) => collaborator.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collaborator_id' })
  collaborator: Collaborator;
}
