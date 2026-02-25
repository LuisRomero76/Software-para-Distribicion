import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { GastoOperativoCategoria } from './gasto_operativo_categoria.entity';

export enum CategoriaGasto {
  COMBUSTIBLE = 'COMBUSTIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  GENERAL = 'GENERAL'
}

export enum TipoEgreso {
  COMPRA = 'COMPRA',
  COMBUSTIBLE = 'COMBUSTIBLE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  OPERATIVO = 'OPERATIVO',
  NOMINA = 'NOMINA',
  OTRO = 'OTRO'
}

@Entity()
export class GastoOperativo {
  @PrimaryGeneratedColumn()
  gasto_id: number;

  @Column({ type: 'enum', enum: TipoEgreso, default: TipoEgreso.OTRO })
  tipo: TipoEgreso;

  @Column({ type: 'enum', enum: CategoriaGasto, nullable: true })
  categoria: CategoriaGasto;

  @Column({ nullable: true })
  categoria_id: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  descripcion: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ nullable: true })
  vehiculo_id: number | null;

  @Column({ type: 'int', nullable: true })
  referencia_id: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Vehicle, (vehiculo) => vehiculo.gastosOperativos, { nullable: true })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehicle | null;

  @ManyToOne(() => GastoOperativoCategoria, (cat) => cat.gastos, { nullable: true, eager: true })
  @JoinColumn({ name: 'categoria_id' })
  categoriaRelacion: GastoOperativoCategoria | null;
}
