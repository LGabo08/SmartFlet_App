import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, walletOutline, createOutline,
  searchOutline, trashOutline, swapVerticalOutline,
} from 'ionicons/icons';
import { OperadorCuotaService, OperadorCuota } from 'src/app/services/operador-cuota.service';

@Component({
  selector: 'app-cuotas-operador',
  standalone: true,
  templateUrl: './cuotas-operador.page.html',
  styleUrls: ['./cuotas-operador.page.scss'],
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon,
  ]
})
export class CuotasOperadorPage implements OnInit {
  operadorId:     number | null = null;
  operadorNombre  = '';
  numeroEmpleado  = '';

  cuotas:          OperadorCuota[] = [];
  cuotasFiltradas: OperadorCuota[] = [];

  searchTerm = '';
  saving     = false;
  deleting   = false;

  resumen = {
    periodo:         '',
    fecha_inicio:    '',
    fecha_fin:       '',
    cuota_objetivo:  0,
    cuota_realizada: 0,
    cuota_restante:  0,
    estado_cuota:    'SIN_CONFIGURAR'
  };

  form = {
    fecha_inicio:    '',
    fecha_fin:       '',
    cuota_objetivo:  0,
    cuota_realizada: 0,
  };

  editingId: number | null = null;

  // Para validación de máx 7 días en el input de fecha_fin
  maxFechaFin = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private operadorCuotaService: OperadorCuotaService
  ) {
    addIcons({ arrowBackOutline, walletOutline, createOutline, searchOutline, trashOutline, swapVerticalOutline });
  }

  goBack(): void { this.router.navigate(['/operador']); }

  ngOnInit(): void {
    this.operadorId = Number(this.route.snapshot.paramMap.get('id'));
    this.setDefaultDates();
    if (this.operadorId) this.loadCuotas();
  }

  setDefaultDates() {
    const hoy   = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)); // lunes de esta semana
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    this.form.fecha_inicio = lunes.toISOString().split('T')[0];
    this.form.fecha_fin    = domingo.toISOString().split('T')[0];
    this.updateMaxFechaFin();
  }

  onFechaInicioChange() {
    this.updateMaxFechaFin();
    // Ajusta fecha_fin si excede 7 días
    if (this.form.fecha_inicio && this.form.fecha_fin) {
      const inicio = new Date(this.form.fecha_inicio);
      const fin    = new Date(this.form.fecha_fin);
      const diff   = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > 6) {
        const nuevoFin = new Date(inicio);
        nuevoFin.setDate(inicio.getDate() + 6);
        this.form.fecha_fin = nuevoFin.toISOString().split('T')[0];
      }
    }
  }

  updateMaxFechaFin() {
    if (!this.form.fecha_inicio) return;
    const inicio = new Date(this.form.fecha_inicio);
    const max    = new Date(inicio);
    max.setDate(inicio.getDate() + 6);
    this.maxFechaFin = max.toISOString().split('T')[0];
  }

  get diasRango(): number {
    if (!this.form.fecha_inicio || !this.form.fecha_fin) return 0;
    const inicio = new Date(this.form.fecha_inicio);
    const fin    = new Date(this.form.fecha_fin);
    return Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  loadCuotas(): void {
    if (!this.operadorId) return;
    this.operadorCuotaService.getCuotasPorOperador(this.operadorId).subscribe({
      next: (response: any) => {
        const operador = response?.operador ?? null;
        const resumen  = response?.resumen  ?? null;
        const cuotas   = Array.isArray(response?.cuotas) ? response.cuotas : [];

        this.operadorNombre = operador?.nombre_completo || '';
        this.numeroEmpleado = operador?.numero_empleado || '';

        this.cuotas = cuotas.map((c: any) => ({
          id_op_cuota:     c.id_op_cuota,
          fk_operador:     c.fk_operador,
          periodo:         c.periodo,
          fecha_inicio:    c.fecha_inicio,
          fecha_fin:       c.fecha_fin,
          cuota_objetivo:  Number(c.cuota_objetivo  ?? 0),
          cuota_realizada: Number(c.cuota_realizada ?? 0),
          cuota_restante:  Number(c.cuota_restante  ?? 0),
          estado_cuota:    c.estado_cuota ?? 'SIN_CONFIGURAR'
        }));

        this.cuotasFiltradas = [...this.cuotas];

        if (resumen) {
          this.resumen = {
            periodo:         resumen.periodo         ?? '',
            fecha_inicio:    resumen.fecha_inicio    ?? '',
            fecha_fin:       resumen.fecha_fin       ?? '',
            cuota_objetivo:  Number(resumen.cuota_objetivo  ?? 0),
            cuota_realizada: Number(resumen.cuota_realizada ?? 0),
            cuota_restante:  Number(resumen.cuota_restante  ?? 0),
            estado_cuota:    resumen.estado_cuota    ?? 'SIN_CONFIGURAR'
          };
        }

        this.applyFilter();
      },
      error: (err) => alert(err?.error?.msg || 'Error al cargar cuotas del operador')
    });
  }

  saveCuota(): void {
    if (!this.operadorId) { alert('Operador inválido.'); return; }
    if (!this.form.fecha_inicio || !this.form.fecha_fin) {
      alert('Las fechas son obligatorias.'); return;
    }
    if (this.diasRango > 7) {
      alert('El rango no puede exceder 7 días.'); return;
    }
    if (this.form.cuota_objetivo < 0) {
      alert('La cuota objetivo no puede ser negativa.'); return;
    }

    const payload: any = {
      fk_operador:     this.operadorId,
      fecha_inicio:    this.form.fecha_inicio,
      fecha_fin:       this.form.fecha_fin,
      cuota_objetivo:  this.form.cuota_objetivo,
      cuota_realizada: this.form.cuota_realizada,
    };

    this.saving = true;

    if (this.editingId) {
      this.operadorCuotaService.updateCuota(this.editingId, payload).subscribe({
        next: (res: any) => {
          this.saving = false;
          alert(res?.msg || 'Cuota actualizada correctamente.');
          this.resetForm();
          this.loadCuotas();
        },
        error: (err) => {
          this.saving = false;
          alert(err?.error?.msg || 'Error al actualizar cuota');
        }
      });
      return;
    }

    this.operadorCuotaService.createCuota(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        alert(res?.msg || 'Cuota creada correctamente.');
        this.resetForm();
        this.loadCuotas();
      },
      error: (err) => {
        this.saving = false;
        alert(err?.error?.msg || 'Error al guardar cuota');
      }
    });
  }

  editCuota(c: OperadorCuota): void {
    this.editingId = c.id_op_cuota ?? null;
    this.form = {
      fecha_inicio:    c.fecha_inicio,
      fecha_fin:       c.fecha_fin,
      cuota_objetivo:  Number(c.cuota_objetivo  ?? 0),
      cuota_realizada: Number(c.cuota_realizada ?? 0),
    };
    this.updateMaxFechaFin();
  }

  deleteCuota(c: OperadorCuota): void {
    if (!c.id_op_cuota) return;
    if (!confirm(`¿Eliminar la cuota del ${c.fecha_inicio} al ${c.fecha_fin}?`)) return;
    this.deleting = true;
    this.operadorCuotaService.deleteCuota(c.id_op_cuota).subscribe({
      next: (res: any) => {
        this.deleting = false;
        alert(res?.msg || 'Cuota eliminada correctamente.');
        if (this.editingId === c.id_op_cuota) this.resetForm();
        this.loadCuotas();
      },
      error: (err) => {
        this.deleting = false;
        alert(err?.error?.msg || 'Error al eliminar cuota');
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.setDefaultDates();
    this.form.cuota_objetivo  = 0;
    this.form.cuota_realizada = 0;
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.cuotasFiltradas = this.cuotas.filter((c) => {
      const inicio = String(c.fecha_inicio || '').toLowerCase();
      const fin    = String(c.fecha_fin    || '').toLowerCase();
      const estado = String(c.estado_cuota || '').toLowerCase();
      return !term || inicio.includes(term) || fin.includes(term) || estado.includes(term);
    });
  }

  getEstadoLabel(c: OperadorCuota): string { return c.estado_cuota || 'SIN_CONFIGURAR'; }

  getEstadoClass(c: OperadorCuota): string {
    switch ((c.estado_cuota || '').toUpperCase()) {
      case 'ACTIVA':  return 'ok';
      case 'BAJA':    return 'warn';
      case 'AGOTADA': return 'off';
      default:        return 'off';
    }
  }

  esCuotaActiva(c: OperadorCuota): boolean {
    const hoy = new Date().toISOString().split('T')[0];
    return c.fecha_inicio <= hoy && c.fecha_fin >= hoy;
  }
}