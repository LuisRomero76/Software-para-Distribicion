import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Compra } from 'src/compra/entities/compra.entity';

@Entity()
export class PagoCompra {
  @PrimaryGeneratedColumn()
  pago_compra_id: number;

  @Column({ type: 'int' })
  compra_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha_pago: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Compra, compra => compra.pagos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'compra_id' })
  compra: Compra;
}
