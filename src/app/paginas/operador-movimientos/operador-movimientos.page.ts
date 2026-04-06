import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OperadorCuotaService } from 'src/app/services/operador-cuota.service';

@Component({
  selector: 'app-operador-movimientos',
  templateUrl: './operador-movimientos.page.html',
  styleUrls: ['./operador-movimientos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class OperadorMovimientosPage implements OnInit {
  idOperador!: number;

  movimientos:          any[] = [];
  movimientosFiltrados: any[] = [];
  totales = { ingresos: 0, egresos: 0, balance: 0 };

  cargando = true;
  error    = false;

  // Rango de fechas — default últimos 7 días
  fechaInicio = '';
  fechaFin    = '';

  tipoFiltro = '';

  readonly TIPO_LABEL: Record<string, string> = {
    ASIGNACION:    '✅ Asignación',
    CAMBIO_TARIFA: '💲 Cambio de tarifa',
    CANCELACION:   '🚫 Cancelación',
  };

  readonly TIPO_COLOR: Record<string, string> = {
    ASIGNACION:    'success',
    CAMBIO_TARIFA: 'primary',
    CANCELACION:   'danger',
  };

  constructor(
    private route: ActivatedRoute,
    private operadorCuotaService: OperadorCuotaService,
  ) {}

  ngOnInit(): void {
    this.idOperador = Number(this.route.snapshot.paramMap.get('id'));

    // Si se recibe un rango desde query params (ej. al venir desde tabla de cuotas)
    const qInicio = this.route.snapshot.queryParamMap.get('fecha_inicio');
    const qFin    = this.route.snapshot.queryParamMap.get('fecha_fin');

    if (qInicio && qFin) {
      this.fechaInicio = qInicio;
      this.fechaFin    = qFin;
    } else {
      this.setUltimos7Dias();
    }

    this.cargarMovimientos();
  }

  /** Últimos 7 días: hace 6 días → hoy */
  setUltimos7Dias(): void {
    const hoy   = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 6);
    this.fechaFin    = hoy.toISOString().split('T')[0];
    this.fechaInicio = inicio.toISOString().split('T')[0];
  }

  /**
   * Llama al servicio con fecha_inicio y fecha_fin.
   * El backend aplica: WHERE DATE(created_at) BETWEEN :fecha_inicio AND :fecha_fin
   * Si no se mandan, el backend aplica por defecto los últimos 7 días en su lado.
   */
  cargarMovimientos(): void {
    this.cargando = true;
    this.error    = false;

    this.operadorCuotaService
      .obtenerMovimientos(this.idOperador, this.fechaInicio, this.fechaFin)
      .subscribe({
        next: (res: any) => {
          this.movimientos = res?.movimientos ?? [];
          this.totales     = res?.totales    ?? { ingresos: 0, egresos: 0, balance: 0 };
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: () => {
          this.cargando = false;
          this.error    = true;
        },
      });
  }

  aplicarFiltros(): void {
    this.movimientosFiltrados = this.movimientos.filter(m =>
      !this.tipoFiltro || m.tipo === this.tipoFiltro
    );

    // Recalcular totales sobre el subconjunto filtrado por tipo
    this.totales.ingresos = this.movimientosFiltrados
      .filter(m => m.monto > 0)
      .reduce((s, m) => s + Number(m.monto), 0);
    this.totales.egresos  = this.movimientosFiltrados
      .filter(m => m.monto < 0)
      .reduce((s, m) => s + Math.abs(Number(m.monto)), 0);
    this.totales.balance  = this.totales.ingresos - this.totales.egresos;
  }

  buscarPorRango(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('Selecciona un rango de fechas válido.');
      return;
    }
    this.cargarMovimientos();
  }

  limpiarFiltros(): void {
    this.setUltimos7Dias();
    this.tipoFiltro = '';
    this.cargarMovimientos();
  }

  colorTipo(tipo: string): string { return this.TIPO_COLOR[tipo] ?? 'medium'; }
  labelTipo(tipo: string): string { return this.TIPO_LABEL[tipo] ?? tipo; }
  esIngreso(monto: number): boolean { return Number(monto) > 0; }
}