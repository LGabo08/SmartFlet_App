import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, walletOutline, createOutline,
  searchOutline, trashOutline, swapVerticalOutline,
  addCircleOutline, closeOutline, addOutline,
  chevronDownOutline, chevronUpOutline, peopleOutline,
} from 'ionicons/icons';
import { OperadorCuotaService, OperadorCuota } from 'src/app/services/operador-cuota.service';

interface OperadorConCuotas {
  id_operador:      number;
  nombre_completo:  string;
  // cuotas siempre es array (nunca undefined) para evitar TS2532 en el template
  numero_empleado:  string;
  cuotas:           OperadorCuota[];
  cuota_activa:     OperadorCuota | null;
}

@Component({
  selector: 'app-cuotas-global',
  standalone: true,
  templateUrl: './cuotas-global.page.html',
  styleUrls: ['./cuotas-global.page.scss'],
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonSpinner,
  ],
})
export class CuotasGlobalPage implements OnInit {

  operadores:          OperadorConCuotas[] = [];
  operadoresFiltrados: OperadorConCuotas[] = [];

  /** IDs con el panel de historial abierto */
  expandedIds = new Set<number>();

  searchTerm = '';
  cargando   = false;
  saving     = false;
  deleting   = false;
  showForm   = false;

  resumenGlobal = {
    total_operadores: 0,
    total_objetivo:   0,
    total_realizado:  0,
    total_restante:   0,
  };

  form: {
    fk_operador:     number | '';
    fecha_inicio:    string;
    fecha_fin:       string;
    cuota_objetivo:  number;
    cuota_realizada: number;
  } = {
    fk_operador:     '',
    fecha_inicio:    '',
    fecha_fin:       '',
    cuota_objetivo:  0,
    cuota_realizada: 0,
  };

  editingId:   number | null = null;
  maxFechaFin  = '';

  constructor(
    private router: Router,
    private operadorCuotaService: OperadorCuotaService,
  ) {
    addIcons({
      arrowBackOutline, walletOutline, createOutline,
      searchOutline, trashOutline, swapVerticalOutline,
      addCircleOutline, closeOutline, addOutline,
      chevronDownOutline, chevronUpOutline, peopleOutline,
    });
  }

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadAll();
  }

  goBack(): void { this.router.navigate(['/operador']); }

  // ─── Carga ────────────────────────────────────────────────────────────────
  /**
   * Llama al endpoint GET /api/operadores/cuotas-global
   * que devuelve: { ok, operadores: [{ id_operador, nombre_completo,
   *   numero_empleado, cuota_activa, cuotas[] }] }
   *
   * El método getAllCuotas() está definido en el servicio actualizado.
   */
  loadAll(): void {
    this.cargando = true;
    this.operadorCuotaService.getAllCuotas().subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res?.operadores) ? res.operadores : [];

        const hoy = new Date().toISOString().split('T')[0];

        this.operadores = raw.map(op => {
          const cuotas: OperadorCuota[] = (op.cuotas ?? []).map((c: any) => ({
            id_op_cuota:     c.id_op_cuota,
            fk_operador:     c.fk_operador,
            periodo:         c.periodo,
            fecha_inicio:    c.fecha_inicio,
            fecha_fin:       c.fecha_fin,
            cuota_objetivo:  Number(c.cuota_objetivo  ?? 0),
            cuota_realizada: Number(c.cuota_realizada ?? 0),
            cuota_restante:  Number(c.cuota_restante  ?? 0),
            estado_cuota:    c.estado_cuota ?? 'SIN_CONFIGURAR',
          }));

          // cuota_activa viene del backend; si no, la calculamos aquí
          const cuota_activa: OperadorCuota | null = op.cuota_activa
            ? {
                ...op.cuota_activa,
                cuota_objetivo:  Number(op.cuota_activa.cuota_objetivo  ?? 0),
                cuota_realizada: Number(op.cuota_activa.cuota_realizada ?? 0),
                cuota_restante:  Number(op.cuota_activa.cuota_restante  ?? 0),
              }
            : cuotas.find(c => c.fecha_inicio <= hoy && c.fecha_fin >= hoy) ?? null;

          return {
            id_operador:     op.id_operador,
            nombre_completo: op.nombre_completo ?? '',
            numero_empleado: op.numero_empleado ?? '',
            cuotas,
            cuota_activa,
          } as OperadorConCuotas;
        });

        this.calcularResumenGlobal();
        this.applyFilter();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        alert('Error al cargar cuotas de operadores.');
      },
    });
  }

  calcularResumenGlobal(): void {
    this.resumenGlobal = { total_operadores: this.operadores.length, total_objetivo: 0, total_realizado: 0, total_restante: 0 };
    for (const op of this.operadores) {
      if (op.cuota_activa) {
        this.resumenGlobal.total_objetivo  += op.cuota_activa.cuota_objetivo;
        this.resumenGlobal.total_realizado += op.cuota_activa.cuota_realizada;
        this.resumenGlobal.total_restante  += op.cuota_activa.cuota_restante ?? 0;
      }
    }
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  toggleOperador(id: number): void {
    this.expandedIds.has(id) ? this.expandedIds.delete(id) : this.expandedIds.add(id);
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  getInitials(name: string): string {
    return (name ?? '').trim().split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  }

  getProgreso(c: OperadorCuota): number {
    if (!c.cuota_objetivo) return 0;
    return Math.min(100, Math.round((c.cuota_realizada / c.cuota_objetivo) * 100));
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.operadoresFiltrados = this.operadores.filter(op => {
      if (!term) return true;
      return (
        op.nombre_completo.toLowerCase().includes(term) ||
        (op.numero_empleado ?? '').toLowerCase().includes(term) ||
        op.cuotas.some(c => (c.estado_cuota ?? '').toLowerCase().includes(term))
      );
    });
  }

  // ─── Fechas ───────────────────────────────────────────────────────────────

  setDefaultDates(): void {
    const hoy   = new Date();
    const lunes  = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    this.form.fecha_inicio = lunes.toISOString().split('T')[0];
    this.form.fecha_fin    = domingo.toISOString().split('T')[0];
    this.updateMaxFechaFin();
  }

  onFechaInicioChange(): void {
    this.updateMaxFechaFin();
    if (this.form.fecha_inicio && this.form.fecha_fin) {
      const diff = (new Date(this.form.fecha_fin).getTime() - new Date(this.form.fecha_inicio).getTime()) / 86_400_000;
      if (diff > 6) {
        const nuevoFin = new Date(this.form.fecha_inicio);
        nuevoFin.setDate(nuevoFin.getDate() + 6);
        this.form.fecha_fin = nuevoFin.toISOString().split('T')[0];
      }
    }
  }

  updateMaxFechaFin(): void {
    if (!this.form.fecha_inicio) return;
    const max = new Date(this.form.fecha_inicio);
    max.setDate(max.getDate() + 6);
    this.maxFechaFin = max.toISOString().split('T')[0];
  }

  get diasRango(): number {
    if (!this.form.fecha_inicio || !this.form.fecha_fin) return 0;
    return Math.round((new Date(this.form.fecha_fin).getTime() - new Date(this.form.fecha_inicio).getTime()) / 86_400_000) + 1;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  prepararNuevaCuota(op: OperadorConCuotas): void {
    this.resetForm();
    this.form.fk_operador = op.id_operador;
    this.showForm = true;
    setTimeout(() => document.querySelector('.quota-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  editCuota(c: OperadorCuota, op: OperadorConCuotas): void {
    this.editingId = c.id_op_cuota ?? null;
    this.form = {
      fk_operador:     op.id_operador,
      fecha_inicio:    c.fecha_inicio,
      fecha_fin:       c.fecha_fin,
      cuota_objetivo:  Number(c.cuota_objetivo  ?? 0),
      cuota_realizada: Number(c.cuota_realizada ?? 0),
    };
    this.updateMaxFechaFin();
    this.showForm = true;
    setTimeout(() => document.querySelector('.quota-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  saveCuota(): void {
    if (!this.form.fk_operador)             { alert('Selecciona un operador.');           return; }
    if (!this.form.fecha_inicio || !this.form.fecha_fin) { alert('Las fechas son obligatorias.'); return; }
    if (this.diasRango > 7)                 { alert('El rango no puede exceder 7 días.'); return; }
    if (this.form.cuota_objetivo < 0)       { alert('La cuota objetivo no puede ser negativa.'); return; }

    const payload: any = {
      fk_operador:     this.form.fk_operador,
      fecha_inicio:    this.form.fecha_inicio,
      fecha_fin:       this.form.fecha_fin,
      cuota_objetivo:  this.form.cuota_objetivo,
      cuota_realizada: this.form.cuota_realizada,
    };

    this.saving = true;

    const obs = this.editingId
      ? this.operadorCuotaService.updateCuota(this.editingId, payload)
      : this.operadorCuotaService.createCuota(payload);

    obs.subscribe({
      next: (res: any) => {
        this.saving = false;
        alert(res?.msg || (this.editingId ? 'Cuota actualizada.' : 'Cuota creada.'));
        this.resetForm();
        this.showForm = false;
        this.loadAll();
      },
      error: (err: any) => {
        this.saving = false;
        alert(err?.error?.msg || 'Error al guardar cuota.');
      },
    });
  }

  deleteCuota(c: OperadorCuota): void {
    if (!c.id_op_cuota) return;
    if (!confirm(`¿Eliminar la cuota del ${c.fecha_inicio} al ${c.fecha_fin}?`)) return;
    this.deleting = true;
    this.operadorCuotaService.deleteCuota(c.id_op_cuota).subscribe({
      next: (res: any) => {
        this.deleting = false;
        alert(res?.msg || 'Cuota eliminada.');
        this.loadAll();
      },
      error: (err: any) => {
        this.deleting = false;
        alert(err?.error?.msg || 'Error al eliminar cuota.');
      },
    });
  }

  resetForm(): void {
    this.editingId            = null;
    this.form.fk_operador     = '';
    this.form.cuota_objetivo  = 0;
    this.form.cuota_realizada = 0;
    this.setDefaultDates();
  }

  // ─── Estado ───────────────────────────────────────────────────────────────

  esCuotaActiva(c: OperadorCuota): boolean {
    const hoy = new Date().toISOString().split('T')[0];
    return c.fecha_inicio <= hoy && c.fecha_fin >= hoy;
  }

 getEstadoClass(c: OperadorCuota): string {
  switch ((c.estado_cuota ?? '').toUpperCase()) {
    case 'ACTIVA':         return 'ok';
    case 'CUMPLIDA':       return 'cumplida';
    case 'EXCEDIDA':       return 'excedida';
    case 'PENDIENTE':      return 'pendiente';
    case 'AGOTADA':        return 'off';
    case 'SIN_CONFIGURAR': return 'off';
    default:               return 'off';
  }
}
}