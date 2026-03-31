import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';
import { PanelService } from 'src/app/services/panel.service';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, IonicModule, ],
  templateUrl: './panel.page.html',
  styleUrls: ['./panel.page.scss'],
})
export class PanelPage implements OnInit, ViewWillEnter {

  cargando = true;
  error    = false;

  // ── KPIs ─────────────────────────────────────────────────────────────────
  kpisOperadores = {
    total: 0, disponibles: 0, en_viaje: 0,
    asignados: 0, no_disponibles: 0, inactivos: 0,
  };

  kpisViajes = {
    total: 0, pendientes: 0, asignados: 0,
    en_curso: 0, terminados: 0, cancelados: 0,
  };

  kpisCuotas = { objetivo: 0, realizada: 0, equilibrio_pct: 0 };

  // ── Listas ────────────────────────────────────────────────────────────────
  viajesEnCurso: any[] = [];
  rezagados: any[]     = [];
  alertas: any[]       = [];

  // ── Gráfica chips ─────────────────────────────────────────────────────────
  periodoActivo: 'dia' | 'semana' | 'mes' = 'dia';

  constructor(
    private router: Router,
    private panelService: PanelService,
  ) {}

  ngOnInit() { this.cargarResumen(); }
  ionViewWillEnter() { this.cargarResumen(); }

  cargarResumen() {
    this.cargando = true;
    this.error    = false;
    this.panelService.getResumen().subscribe({
      next: (res: any) => {
        if (res?.ok) {
          this.kpisOperadores = res.kpis.operadores;
          this.kpisViajes     = res.kpis.viajes;
          this.kpisCuotas     = res.kpis.cuotas;
          this.viajesEnCurso  = res.viajes_en_curso ?? [];
          this.rezagados      = res.rezagados ?? [];
          this.alertas        = res.alertas ?? [];
        }
        this.cargando = false;
      },
      error: () => {
        this.error    = true;
        this.cargando = false;
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get equilibrioBarWidth(): number {
    return Math.min(100, this.kpisCuotas.equilibrio_pct);
  }

  get equilibrioEstado(): 'bad' | 'ok' | 'good' {
    if (this.kpisCuotas.equilibrio_pct < 50) return 'bad';
    if (this.kpisCuotas.equilibrio_pct < 85) return 'ok';
    return 'good';
  }

  get equilibrioTexto(): string {
    if (this.kpisCuotas.equilibrio_pct < 50) return 'Cuota baja — atención';
    if (this.kpisCuotas.equilibrio_pct < 85) return 'En progreso';
    return 'Cuota en buen ritmo';
  }

  getPctCuota(r: any): number {
    return parseFloat(r.pct_cuota ?? 0);
  }

  getPctColor(pct: number): string {
    if (pct < 30) return '#dc2626';
    if (pct < 60) return '#f59e0b';
    return '#16a34a';
  }

  getNivelColor(nivel: string): string {
    return nivel === 'danger' ? '#dc2626' : '#f59e0b';
  }

  setPeriodo(p: 'dia' | 'semana' | 'mes') {
    this.periodoActivo = p;
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  irAsignaciones()  { this.router.navigate(['/asignaciones']); }
  irOperadores()    { this.router.navigate(['/operador']); }
  irUnidades()      { this.router.navigate(['/unidades']); }
  irViajes()        { this.router.navigate(['/viajes']); }
  irDetalle(id: number) { this.router.navigate(['/viajes', id, 'historial']); }

  trackById(_: number, item: any) { return item.id_viaje ?? item.id_operador; }
}