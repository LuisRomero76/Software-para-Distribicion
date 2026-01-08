import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IngresoCategoria } from './ingreso_categoria.entity';

export enum TipoIngreso {
  VENTA = 'VENTA',
  COMPRA = 'COMPRA',
  PRESTAMO = 'PRESTAMO',
  DEVOLUCION = 'DEVOLUCION',
  OTRO = 'OTRO'
}

@Entity()
export class Ingreso {
  @PrimaryGeneratedColumn()
  ingreso_id: number;

  @Column({ type: 'enum', enum: TipoIngreso, default: TipoIngreso.OTRO })
  tipo: TipoIngreso;

  @Column({ nullable: true })
  categoria_id: number | null;

  @Column({ type: 'varchar', length: 200 })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'int', nullable: true })
  referencia_id: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => IngresoCategoria, (categoria) => categoria.ingresos, { nullable: true, eager: true })
  @JoinColumn({ name: 'categoria_id' })
  categoriaRelacion: IngresoCategoria;
}
