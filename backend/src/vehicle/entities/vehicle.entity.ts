import { VehicleAssignment } from 'src/distribution/entities/vehicle-assignment.entity';
import { GastoOperativo } from 'src/gasto_operativo/entities/gasto_operativo.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  vehicle_id: number;

  @Column()
  placa: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column({ type: 'int' })
  año: number;

  @Column({ nullable: true })
  capacidad_carga: number;

  @Column({ default: true })
  disponible: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => VehicleAssignment, (assignment) => assignment.vehicle, { cascade: true })
  assignments: VehicleAssignment[];

  @OneToMany(() => GastoOperativo, (gasto) => gasto.vehiculo)
  gastosOperativos: GastoOperativo[];
}
