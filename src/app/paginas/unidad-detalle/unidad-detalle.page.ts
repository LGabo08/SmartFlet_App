import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, createOutline, busOutline,
  personOutline, swapHorizontalOutline, locationOutline,
  arrowForwardOutline, pencilOutline, personAddOutline,
  personRemoveOutline, alertCircleOutline, warningOutline,
  checkmarkOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import { LoadingController, ToastController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonButtons, IonInput, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonLabel, IonModal, IonTextarea
} from '@ionic/angular/standalone';

import { UnidadService } from 'src/app/services/unidad.service';
import { OperadorService } from 'src/app/services/operador.service';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';

type ActiveTab = 'info' | 'historial-estado' | 'historial-zona';

@Component({
  selector: 'app-unidad-detalle',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonButtons,
    IonInput, IonSelect, IonSelectOption,
    IonSegment, IonSegmentButton, IonLabel,
    IonModal, IonTextarea,
  ],
  templateUrl: './unidad-detalle.page.html',
  styleUrls: ['./unidad-detalle.page.scss'],
})
export class UnidadDetallePage implements OnInit {

  idUnidad!: number;
  activeTab: ActiveTab = 'info';
  editMode = false;

  unidad: any = null;
  operadorAsignado: any = null;
  private snapshot: any = null;

  form = {
    numero_economico: '',
    fk_licencia_requerida: null as number | null,
  };

  zonas: any[] = [];
  licencias: any[] = [];
  operadores: any[] = [];

  // ── Historial estado ──────────────────────────────────────────────────────
  historialEstado: any[] = [];
  loadingHistorialEstado = false;
  filtradoEstado = false;
  totalEstado = 0;
  filtroEstado = { estado_anterior: '', estado_nuevo: '', fecha_desde: '', fecha_hasta: '' };
  estadosUnidad = ['DISPONIBLE', 'NO_DISPONIBLE', 'EN_VIAJE', 'MANTENIMIENTO', 'BAJA'];

  // ── Historial zona ────────────────────────────────────────────────────────
  historialZona: any[] = [];
  loadingHistorialZona = false;
  filtradoZona = false;
  totalZona = 0;
  filtroZona = { zona_anterior: '', zona_nueva: '', fecha_desde: '', fecha_hasta: '' };

  // ── Modal cambiar estado ──────────────────────────────────────────────────
  showModalEstado = false;
  cambioEstado = { estado_nuevo: '', motivo: '' };
  savingEstado = false;

  // ── Modal asignar operador ────────────────────────────────────────────────
  showModalAsignar = false;
  operadorSeleccionado: number | null = null;
  savingAsignar = false;

  // ── Modal quitar operador ─────────────────────────────────────────────────
  showModalQuitar = false;
  savingQuitar = false;

  // ── Modal cambiar zona ────────────────────────────────────────────────────
  showModalZona = false;
  cambioZona = { zona_nueva: null as number | null, motivo: '' };
  savingZona = false;

  // ── Historial operadores ──────────────────────────────────────────────────
  historialOperadores: any[] = [];
  loadingHistorialOp = false;
  filtradoOp = false;
  totalOp = 0;
  filtroOp = { tipo: '', fecha_desde: '', fecha_hasta: '' };
  showHistorialOp = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private unidadSvc: UnidadService,
    private operadorSvc: OperadorService,
    private certSvc: DatosViajeService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      arrowBackOutline, createOutline, busOutline,
      personOutline, swapHorizontalOutline, locationOutline,
      arrowForwardOutline, pencilOutline, personAddOutline,
      personRemoveOutline, alertCircleOutline, warningOutline,
      checkmarkOutline, checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.idUnidad = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCatalogos();
    this.loadUnidad();
  }

  // ── Guard EN_VIAJE ────────────────────────────────────────────────────────
 get isEnViaje(): boolean {
  return ['EN_VIAJE', 'ASIGNADA_A_VIAJE'].includes(this.unidad?.estado ?? '');
}

  // ── Historial operadores ──────────────────────────────────────────────────
  loadHistorialOperadores(filtros?: any) {
    this.loadingHistorialOp = true;
    this.unidadSvc.getHistorialOperadores(this.idUnidad, filtros).subscribe({
      next: (res: any) => {
        this.historialOperadores = res?.historial ?? [];
        this.filtradoOp          = res?.filtrado  ?? false;
        this.totalOp             = res?.total     ?? 0;
        this.loadingHistorialOp  = false;
      },
      error: () => {
        this.toast('No se pudo cargar el historial de operadores', 'warning');
        this.loadingHistorialOp = false;
      }
    });
  }

  toggleHistorialOp() {
    this.showHistorialOp = !this.showHistorialOp;
    if (this.showHistorialOp && this.historialOperadores.length === 0) {
      this.loadHistorialOperadores();
    }
  }

  aplicarFiltroOp() { this.historialOperadores = []; this.loadHistorialOperadores(this.filtroOp); }
  limpiarFiltroOp() {
    this.filtroOp = { tipo: '', fecha_desde: '', fecha_hasta: '' };
    this.historialOperadores = [];
    this.loadHistorialOperadores();
  }

  // ── Catálogos ─────────────────────────────────────────────────────────────
  private loadCatalogos() {
    this.certSvc.getZonas().subscribe({
      next: (res: any) => this.zonas = Array.isArray(res) ? res : (res?.zonas ?? [])
    });
    this.unidadSvc.getLicencias().subscribe({
      next: (res: any) => this.licencias = Array.isArray(res) ? res : (res?.licencias ?? [])
    });
    this.operadorSvc.getOperadores().subscribe({
      next: (res: any) => {
        const todos = Array.isArray(res) ? res : (res?.operadores ?? []);
        this.operadores = todos.filter((o: any) =>
          !o.fk_unidad_asignada || o.fk_unidad_asignada === this.idUnidad
        );
      }
    });
  }

  // ── Cargar unidad ─────────────────────────────────────────────────────────
  async loadUnidad() {
    const loading = await this.loadingCtrl.create({ message: 'Cargando...' });
    await loading.present();

    this.unidadSvc.getUnidadDetalle(this.idUnidad).subscribe({
      next: async (res: any) => {
        this.unidad           = res?.unidad ?? null;
        this.operadorAsignado = res?.operador_asignado ?? null;
        if (this.unidad) {
          this.form = {
            numero_economico:      this.unidad.numero_economico ?? '',
            fk_licencia_requerida: this.unidad.fk_licencia_requerida ?? null,
          };
          this.snapshot = { ...this.form };
        }
        await loading.dismiss();
      },
      error: async () => {
        await loading.dismiss();
        this.toast('No se pudo cargar la unidad', 'danger');
      }
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  onTabChange(event: any) {
    const tab = event.detail.value as ActiveTab;
    this.activeTab = tab;
    if (tab === 'historial-estado' && this.historialEstado.length === 0) this.loadHistorialEstado();
    if (tab === 'historial-zona'   && this.historialZona.length   === 0) this.loadHistorialZona();
  }

  // ── Historial estado ──────────────────────────────────────────────────────
  loadHistorialEstado(filtros?: any) {
    this.loadingHistorialEstado = true;
    this.unidadSvc.getHistorialEstadoFiltrado(this.idUnidad, filtros).subscribe({
      next: (res: any) => {
        this.historialEstado        = res?.historial ?? [];
        this.filtradoEstado         = res?.filtrado  ?? false;
        this.totalEstado            = res?.total     ?? 0;
        this.loadingHistorialEstado = false;
      },
      error: () => {
        this.toast('No se pudo cargar el historial de estado', 'warning');
        this.loadingHistorialEstado = false;
      }
    });
  }

  aplicarFiltroEstado() { this.historialEstado = []; this.loadHistorialEstado(this.filtroEstado); }
  limpiarFiltroEstado() {
    this.filtroEstado = { estado_anterior: '', estado_nuevo: '', fecha_desde: '', fecha_hasta: '' };
    this.historialEstado = [];
    this.loadHistorialEstado();
  }

  // ── Historial zona ────────────────────────────────────────────────────────
  loadHistorialZona(filtros?: any) {
    this.loadingHistorialZona = true;
    this.unidadSvc.getHistorialZona(this.idUnidad, filtros).subscribe({
      next: (res: any) => {
        this.historialZona       = res?.historial ?? [];
        this.filtradoZona        = res?.filtrado  ?? false;
        this.totalZona           = res?.total     ?? 0;
        this.loadingHistorialZona = false;
      },
      error: () => {
        this.toast('No se pudo cargar el historial de zona', 'warning');
        this.loadingHistorialZona = false;
      }
    });
  }

  aplicarFiltroZona() { this.historialZona = []; this.loadHistorialZona(this.filtroZona); }
  limpiarFiltroZona() {
    this.filtroZona = { zona_anterior: '', zona_nueva: '', fecha_desde: '', fecha_hasta: '' };
    this.historialZona = [];
    this.loadHistorialZona();
  }

  // ── Modal cambiar estado ──────────────────────────────────────────────────
  openModalEstado() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede cambiar el estado', 'warning');
      return;
    }
    this.cambioEstado = { estado_nuevo: this.unidad?.estado ?? '', motivo: '' };
    this.showModalEstado = true;
  }

  async confirmarCambioEstado() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede cambiar el estado', 'warning');
      return;
    }
    if (!this.cambioEstado.estado_nuevo) { this.toast('Selecciona un estado', 'warning'); return; }
    if (!this.cambioEstado.motivo.trim()) { this.toast('El motivo es obligatorio', 'warning'); return; }

    this.savingEstado = true;
    this.unidadSvc.cambiarEstado(String(this.idUnidad), {
      estado_nuevo: this.cambioEstado.estado_nuevo,
      motivo:       this.cambioEstado.motivo,
    }).subscribe({
      next: () => {
        this.unidad.estado   = this.cambioEstado.estado_nuevo;
        this.showModalEstado = false;
        this.savingEstado    = false;
        this.historialEstado = [];
        this.loadHistorialEstado();
        this.toast('Estado actualizado', 'success');
      },
      error: (err: any) => {
        this.savingEstado = false;
        this.toast(err?.error?.msg ?? 'No se pudo actualizar el estado', 'danger');
      }
    });
  }

  // ── Modal cambiar zona ────────────────────────────────────────────────────
  openModalZona() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede cambiar la zona', 'warning');
      return;
    }
    this.cambioZona = { zona_nueva: this.unidad?.fk_zona_actual ?? null, motivo: '' };
    this.showModalZona = true;
  }

  async confirmarCambioZona() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede cambiar la zona', 'warning');
      return;
    }
    if (!this.cambioZona.zona_nueva) { this.toast('Selecciona una zona', 'warning'); return; }
    if (!this.cambioZona.motivo.trim()) { this.toast('El motivo es obligatorio', 'warning'); return; }

    this.savingZona = true;
    this.unidadSvc.cambiarZonaUnidad(this.idUnidad, {
      zona_nueva: this.cambioZona.zona_nueva,
      motivo:     this.cambioZona.motivo,
    }).subscribe({
      next: () => {
        this.unidad.fk_zona_actual = this.cambioZona.zona_nueva;
        this.showModalZona         = false;
        this.savingZona            = false;
        this.historialZona         = [];
        this.loadHistorialZona();
        this.toast('Zona actualizada', 'success');
      },
      error: (err: any) => {
        this.savingZona = false;
        this.toast(err?.error?.msg ?? 'No se pudo actualizar la zona', 'danger');
      }
    });
  }

  // ── Modal asignar operador ────────────────────────────────────────────────
  openModalAsignar() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede asignar operador', 'warning');
      return;
    }
    this.operadorSeleccionado = null;
    this.showModalAsignar = true;
  }

  async confirmarAsignar() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede asignar operador', 'warning');
      return;
    }
    if (!this.operadorSeleccionado) { this.toast('Selecciona un operador', 'warning'); return; }

    this.savingAsignar = true;
    this.unidadSvc.asignarOperador(this.idUnidad, this.operadorSeleccionado).subscribe({
      next: () => {
        this.showModalAsignar = false;
        this.savingAsignar    = false;
        this.toast('Operador asignado correctamente', 'success');
        this.loadUnidad();
      },
      error: (err: any) => {
        this.savingAsignar = false;
        this.toast(err?.error?.msg ?? 'No se pudo asignar el operador', 'danger');
      }
    });
  }

  // ── Modal quitar operador ─────────────────────────────────────────────────
  openModalQuitar() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede quitar el operador', 'warning');
      return;
    }
    this.showModalQuitar = true;
  }

  async confirmarQuitar() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede quitar el operador', 'warning');
      return;
    }
    this.savingQuitar = true;
    this.unidadSvc.quitarOperador(this.idUnidad).subscribe({
      next: () => {
        this.showModalQuitar  = false;
        this.savingQuitar     = false;
        this.operadorAsignado = null;
        this.toast('Operador removido correctamente', 'success');
        this.loadUnidad();
      },
      error: (err: any) => {
        this.savingQuitar = false;
        this.toast(err?.error?.msg ?? 'No se pudo remover el operador', 'danger');
      }
    });
  }

  // ── Edición general ───────────────────────────────────────────────────────
  enableEdit() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede editar', 'warning');
      return;
    }
    this.editMode = true;
    this.snapshot = { ...this.form };
  }

  cancelEdit() { this.form = { ...this.snapshot }; this.editMode = false; }
  goBack()     { this.router.navigate(['unidades']); }

  async save() {
    if (this.isEnViaje) {
      this.toast('La unidad está en viaje activo — no se puede editar', 'warning');
      return;
    }
    if (!this.form.numero_economico.trim()) {
      this.toast('El número económico es obligatorio', 'warning'); return;
    }
    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    this.unidadSvc.updateUnidad(String(this.idUnidad), {
      ...this.unidad,
      numero_economico:      this.form.numero_economico.trim(),
      fk_licencia_requerida: this.form.fk_licencia_requerida,
    }).subscribe({
      next: async () => {
        await loading.dismiss();
        this.unidad.numero_economico = this.form.numero_economico;
        this.editMode = false;
        this.toast('Unidad actualizada', 'success');
      },
      error: async () => {
        await loading.dismiss();
        this.toast('No se pudo actualizar', 'danger');
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getEstadoBadge(estado: string): string {
    const map: Record<string, string> = {
      'DISPONIBLE':    'ok',
      'NO_DISPONIBLE': 'warn',
      'EN_VIAJE':      'travel',
      'MANTENIMIENTO': 'mant',
      'BAJA':          'off',
    };
    return map[estado] ?? '';
  }

  getLicenciaNombre(id: number | null): string {
    if (!id) return '—';
    return this.licencias.find((l: any) => l.id_licencia === id)?.descripcion_licencia ?? '—';
  }

  getZonaNombre(id: number | null): string {
    if (!id) return 'Sin zona';
    return this.zonas.find((z: any) => z.id_zona === id)?.nombre_zona ?? `ID ${id}`;
  }

  private async toast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, color, duration: 1600, position: 'top' });
    await t.present();
  }
}