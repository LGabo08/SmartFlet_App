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

  // Datos
  movimientos: any[] = [];
  movimientosFiltrados: any[] = [];
  totales = { ingresos: 0, egresos: 0, balance: 0 };

  // Estado
  cargando = true;
  error    = false;

  // Filtros
  periodoFiltro = '';
  tipoFiltro    = '';

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

  ngOnInit() {
    this.idOperador  = Number(this.route.snapshot.paramMap.get('id'));
    this.periodoFiltro = this.getPeriodoActual();
    this.cargarMovimientos();
  }

  getPeriodoActual(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  cargarMovimientos() {
    this.cargando = true;
    this.error    = false;

    this.operadorCuotaService.obtenerMovimientos(this.idOperador, this.periodoFiltro || undefined).subscribe({
      next: (res: any) => {
        this.movimientos = res?.movimientos ?? [];
        this.totales     = res?.totales ?? { ingresos: 0, egresos: 0, balance: 0 };
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.error    = true;
      },
    });
  }

  aplicarFiltros() {
    this.movimientosFiltrados = this.movimientos.filter(m => {
      const matchTipo = !this.tipoFiltro || m.tipo === this.tipoFiltro;
      return matchTipo;
    });

    // Recalcular totales sobre filtrados
    this.totales.ingresos = this.movimientosFiltrados
      .filter(m => m.monto > 0).reduce((s, m) => s + Number(m.monto), 0);
    this.totales.egresos  = this.movimientosFiltrados
      .filter(m => m.monto < 0).reduce((s, m) => s + Math.abs(Number(m.monto)), 0);
    this.totales.balance  = this.totales.ingresos - this.totales.egresos;
  }

  buscarPorPeriodo() {
    this.cargarMovimientos();
  }

  limpiarFiltros() {
    this.periodoFiltro = this.getPeriodoActual();
    this.tipoFiltro    = '';
    this.cargarMovimientos();
  }

  colorTipo(tipo: string): string {
    return this.TIPO_COLOR[tipo] ?? 'medium';
  }

  labelTipo(tipo: string): string {
    return this.TIPO_LABEL[tipo] ?? tipo;
  }

  esIngreso(monto: number): boolean {
    return Number(monto) > 0;
  }
}
