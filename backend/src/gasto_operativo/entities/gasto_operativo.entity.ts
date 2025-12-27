import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

export enum CategoriaGasto {
  COMBUSTIBLE = 'COMBUSTIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  GENERAL = 'GENERAL'
}

@Entity()
export class GastoOperativo {
  @PrimaryGeneratedColumn()
  gasto_id: number;

  @Column({ type: 'enum', enum: CategoriaGasto })
  categoria: CategoriaGasto;

  @Column({ type: 'varchar', length: 200 })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ nullable: true })
  vehiculo_id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Vehicle, (vehiculo) => vehiculo.gastosOperativos, { nullable: true })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehicle;
}
