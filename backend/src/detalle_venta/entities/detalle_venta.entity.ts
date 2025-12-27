import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venta } from 'src/venta/entities/venta.entity';
import { Lote } from 'src/lote/entities/lote.entity';

@Entity()
export class DetalleVenta {
  @PrimaryGeneratedColumn()
  detalle_venta_id: number;

  @Column()
  venta_id: number;

  @Column()
  lote_id: number;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_venta_real: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Venta, (venta) => venta.detalles)
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @ManyToOne(() => Lote, (lote) => lote.detallesVenta, { eager: true })
  @JoinColumn({ name: 'lote_id' })
  lote: Lote;
}
