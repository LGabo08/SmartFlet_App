import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, createOutline, closeOutline,
  personOutline, swapHorizontalOutline, locationOutline,
  arrowForwardOutline, pencilOutline, lockClosedOutline,
  checkmarkOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import { LoadingController, ToastController, ViewWillEnter } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonButtons, IonInput, IonSelect, IonSelectOption,
  IonDatetime, IonSegment, IonSegmentButton, IonLabel,
  IonModal, IonTextarea
} from '@ionic/angular/standalone';

import { OperadorService } from 'src/app/services/operador.service';
import { UnidadService } from 'src/app/services/unidad.service';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';

import { Unidad } from 'src/models/unidad.model';
import { Certificacion } from 'src/models/certificacion.model';
import { Licencia } from 'src/models/licencia.model';
import { Zona } from 'src/models/zona.model';

// ✅ ASIGNADO agregado al tipo
type EstadoOperador = 'DISPONIBLE' | 'NO_DISPONIBLE' | 'INACTIVO' | 'EN_VIAJE' | 'ASIGNADO';
type ActiveTab = 'info' | 'historial-estado' | 'historial-zona';

type OperadorForm = {
  id_operador?: number;
  numero_empleado: string;
  nombres: string;
  apellidos: string;
  fk_zona_actual: number | null;
  fk_tipo_licencia: number | null;
  vigencia_licencia: string;
  estado_operador: EstadoOperador;
  fk_unidad_asignada: number | null;
  certificaciones: number[];
};

@Component({
  selector: 'app-operador-detalle',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonButtons,
    IonInput, IonSelect, IonSelectOption, IonDatetime,
    IonSegment, IonSegmentButton, IonLabel,
    IonModal, IonTextarea,
  ],
  templateUrl: './operador-detalle.page.html',
  styleUrls: ['./operador-detalle.page.scss'],
})
export class OperadorDetallePage implements OnInit, ViewWillEnter {

  idOperador!: number;
  activeTab: ActiveTab = 'info';
  editMode = false;

  form: OperadorForm = this.emptyForm();
  private snapshot: OperadorForm | null = null;

  unidades: Unidad[] = [];
  certificaciones: Certificacion[] = [];
  licencias: Licencia[] = [];
  zonas: Zona[] = [];
  clientes: any[] = [];
  certificacionesFiltradas: any[] = [];
  clienteSeleccionado: number | null = null;
  loadingCerts = false;

  historialEstado: any[] = [];
  historialZona: any[] = [];
  loadingHistorialEstado = false;
  loadingHistorialZona   = false;

  filtroEstado = { estado_anterior: '', estado_nuevo: '', fecha_desde: '', fecha_hasta: '' };
  filtradoEstado = false;
  totalEstado = 0;

  filtroZona = { zona_anterior: '', zona_nueva: '', fecha_desde: '', fecha_hasta: '' };
  filtradoZona = false;
  totalZona = 0;

  estadosOperador = ['DISPONIBLE', 'NO_DISPONIBLE', 'INACTIVO', 'EN_VIAJE', 'ASIGNADO'];

  showModalEstado = false;
  showModalZona   = false;

  cambioEstado = { estado_nuevo: '' as EstadoOperador | '', motivo: '' };
  cambioZona   = { zona_nueva: null as number | null, motivo: '' };
  savingCambio = false;

  unidadInfo: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opSvc: OperadorService,
    private unidadSvc: UnidadService,
    private certSvc: DatosViajeService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      arrowBackOutline, createOutline, closeOutline,
      personOutline, swapHorizontalOutline, locationOutline,
      arrowForwardOutline, pencilOutline, lockClosedOutline,
      checkmarkOutline, checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.idOperador = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCatalogos();
  }

  ionViewWillEnter() {
    this.loadOperador();
  }

  // ── Getters de bloqueo ────────────────────────────────────────────────────
  get puedeModificarEstado(): boolean {
    return !['ASIGNADO', 'EN_VIAJE'].includes(this.form.estado_operador);
  }

  get puedeModificarZona(): boolean {
    return !['ASIGNADO', 'EN_VIAJE'].includes(this.form.estado_operador);
  }

  get mensajeBloqueo(): string {
    if (this.form.estado_operador === 'EN_VIAJE') return 'El operador está en viaje activo.';
    if (this.form.estado_operador === 'ASIGNADO')  return 'El operador tiene un viaje asignado.';
    return '';
  }

  // ── Advertencias unidad ───────────────────────────────────────────────────
  get advertenciasUnidad(): { tipo: 'error' | 'warning'; mensaje: string }[] {
    const advertencias: { tipo: 'error' | 'warning'; mensaje: string }[] = [];
    const u = this.unidadInfo;
    if (!u) return advertencias;

    if (u.estado === 'BAJA') {
      advertencias.push({ tipo: 'error', mensaje: 'Esta unidad está dada de baja y no puede ser utilizada.' });
    }
    if (u.estado === 'EN_VIAJE') {
      advertencias.push({ tipo: 'error', mensaje: 'Esta unidad se encuentra en viaje activo. Debe finalizar el viaje antes de reasignarla.' });
    }
    if (u.estado === 'NO_DISPONIBLE') {
      advertencias.push({ tipo: 'warning', mensaje: 'Esta unidad está marcada como no disponible.' });
    }
    if (u.otro_operador_id) {
      advertencias.push({ tipo: 'error', mensaje: `Esta unidad ya está asignada a ${u.otro_operador_nombre}. Debe quitársela antes de reasignarla.` });
    }
    return advertencias;
  }

  get unidadBadgeClass(): string {
    const estado = this.unidadInfo?.estado;
    const map: Record<string, string> = {
      'DISPONIBLE':       'ok',
      'MANTENIMIENTO':    'ok',
      'NO_DISPONIBLE':    'warn',
      'EN_VIAJE':         'travel',
      'BAJA':             'off',
      'ASIGNADA_A_VIAJE': 'assigned',
    };
    return map[estado] ?? '';
  }

  // ── Catalogos ─────────────────────────────────────────────────────────────
  private loadCatalogos() {
    this.unidadSvc.getUnidades().subscribe({
      next: (res: any) => this.unidades = Array.isArray(res) ? res : (res?.unidades ?? [])
    });
    this.certSvc.getCertificaciones().subscribe({
      next: (res: any) => this.certificaciones = Array.isArray(res) ? res : (res?.certificaciones ?? [])
    });
    this.certSvc.getLicencias().subscribe({
      next: (res: any) => this.licencias = Array.isArray(res) ? res : (res?.licencias ?? [])
    });
    this.certSvc.getZonas().subscribe({
      next: (res: any) => this.zonas = Array.isArray(res) ? res : (res?.zonas ?? [])
    });
    this.certSvc.getClientes().subscribe({
      next: (res: any) => this.clientes = Array.isArray(res) ? res : (res?.clientes ?? [])
    });
  }

  async loadOperador() {
    const loading = await this.loadingCtrl.create({ message: 'Cargando...' });
    await loading.present();

    this.opSvc.getOperador(this.idOperador).subscribe({
      next: async (res: any) => {
        const o = res?.operador ?? res;
        this.unidadInfo = res?.unidad_info ?? null;
        this.form = {
          id_operador:        o.id_operador,
          numero_empleado:    o.numero_empleado ?? '',
          nombres:            o.nombres ?? '',
          apellidos:          o.apellidos ?? '',
          fk_zona_actual:     o.fk_zona_actual ?? null,
          fk_tipo_licencia:   o.fk_tipo_licencia ?? null,
          vigencia_licencia:  o.vigencia_licencia ?? '',
          estado_operador:    o.estado_operador ?? 'DISPONIBLE',
          fk_unidad_asignada: o.fk_unidad_asignada ?? null,
          certificaciones:    o.certificaciones?.map((c: any) => c.id_certificacion) ?? []
        };
        this.snapshot = this.clone(this.form);
        await loading.dismiss();
      },
      error: async () => {
        await loading.dismiss();
        this.toast('No se pudo cargar el operador', 'danger');
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

  loadHistorialEstado(filtros?: any) {
    this.loadingHistorialEstado = true;
    this.opSvc.getHistorialEstado(this.idOperador, filtros).subscribe({
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

  loadHistorialZona(filtros?: any) {
    this.loadingHistorialZona = true;
    this.opSvc.getHistorialZona(this.idOperador, filtros).subscribe({
      next: (res: any) => {
        this.historialZona        = res?.historial ?? [];
        this.filtradoZona         = res?.filtrado  ?? false;
        this.totalZona            = res?.total     ?? 0;
        this.loadingHistorialZona = false;
      },
      error: () => {
        this.toast('No se pudo cargar el historial de zona', 'warning');
        this.loadingHistorialZona = false;
      }
    });
  }

  aplicarFiltroEstado() { this.historialEstado = []; this.loadHistorialEstado(this.filtroEstado); }
  limpiarFiltroEstado() {
    this.filtroEstado = { estado_anterior: '', estado_nuevo: '', fecha_desde: '', fecha_hasta: '' };
    this.historialEstado = [];
    this.loadHistorialEstado();
  }

  aplicarFiltroZona() { this.historialZona = []; this.loadHistorialZona(this.filtroZona); }
  limpiarFiltroZona() {
    this.filtroZona = { zona_anterior: '', zona_nueva: '', fecha_desde: '', fecha_hasta: '' };
    this.historialZona = [];
    this.loadHistorialZona();
  }

  // ── Certificaciones ───────────────────────────────────────────────────────
  onClienteChange() {
    this.certificacionesFiltradas = [];
    if (!this.clienteSeleccionado) return;
    this.loadingCerts = true;
    this.certSvc.getCertificacionesPorCliente(Number(this.clienteSeleccionado)).subscribe({
      next: (res: any) => {
        this.certificacionesFiltradas = Array.isArray(res) ? res : (res?.certificaciones ?? []);
        this.loadingCerts = false;
      },
      error: () => {
        this.toast('No se pudieron cargar las certificaciones', 'warning');
        this.loadingCerts = false;
      }
    });
  }

  toggleCertificacion(idCert: number, event: any) {
    const checked = event.detail.checked;
    if (checked) {
      if (!this.form.certificaciones.includes(idCert)) {
        this.form.certificaciones = [...this.form.certificaciones, idCert];
      }
    } else {
      this.form.certificaciones = this.form.certificaciones.filter(id => id !== idCert);
    }
  }

  isCertSelected(idCert: number): boolean {
    return this.form.certificaciones.includes(idCert);
  }

  // ── Modal Estado ──────────────────────────────────────────────────────────
  openModalEstado() {
    if (!this.puedeModificarEstado) {
      this.toast(
        this.form.estado_operador === 'EN_VIAJE'
          ? 'No se puede cambiar el estado mientras el operador está en viaje activo. Debe terminarlo, cancerlar o reasignar su viaje'
          : 'No se puede cambiar el estado mientras el operador tiene un viaje asignado.',
        'warning'
      );
      return;
    }
    this.cambioEstado = { estado_nuevo: this.form.estado_operador, motivo: '' };
    this.showModalEstado = true;
  }

  async confirmarCambioEstado() {
    if (!this.cambioEstado.estado_nuevo) { this.toast('Selecciona un estado', 'warning'); return; }
    if (!this.cambioEstado.motivo.trim()) { this.toast('El motivo es obligatorio', 'warning'); return; }

    this.savingCambio = true;
    this.opSvc.cambiarEstadoOperador(this.idOperador, {
      estado_nuevo: this.cambioEstado.estado_nuevo,
      motivo:       this.cambioEstado.motivo,
    }).subscribe({
      next: () => {
        this.form.estado_operador = this.cambioEstado.estado_nuevo as EstadoOperador;
        this.snapshot = this.clone(this.form);
        this.showModalEstado = false;
        this.savingCambio = false;
        this.historialEstado = [];
        this.loadHistorialEstado();
        this.toast('Estado actualizado', 'success');
      },
      error: (err: any) => {
        this.savingCambio = false;
        this.toast(this.parseApiError(err) ?? 'No se pudo actualizar el estado', 'danger');
      }
    });
  }

  // ── Modal Zona ────────────────────────────────────────────────────────────
  openModalZona() {
    if (!this.puedeModificarZona) {
      this.toast(
        this.form.estado_operador === 'EN_VIAJE'
          ? 'No se puede cambiar la zona mientras el operador está en viaje activo. Debe terminarlo, cancelar o reasignar su viaje'
          : 'No se puede cambiar la zona mientras el operador tiene un viaje asignado.',
        'warning'
      );
      return;
    }
    this.cambioZona = { zona_nueva: this.form.fk_zona_actual, motivo: '' };
    this.showModalZona = true;
  }

  async confirmarCambioZona() {
    if (!this.cambioZona.zona_nueva) { this.toast('Selecciona una zona', 'warning'); return; }
    if (!this.cambioZona.motivo.trim()) { this.toast('El motivo es obligatorio', 'warning'); return; }

    this.savingCambio = true;
    this.opSvc.cambiarZonaOperador(this.idOperador, {
      zona_nueva: this.cambioZona.zona_nueva,
      motivo:     this.cambioZona.motivo,
    }).subscribe({
      next: () => {
        this.form.fk_zona_actual = this.cambioZona.zona_nueva;
        this.snapshot = this.clone(this.form);
        this.showModalZona = false;
        this.savingCambio = false;
        this.historialZona = [];
        this.loadHistorialZona();
        this.toast('Zona actualizada', 'success');
      },
      error: (err: any) => {
        this.savingCambio = false;
        this.toast(this.parseApiError(err) ?? 'No se pudo actualizar la zona', 'danger');
      }
    });
  }

  // ── Edición general ───────────────────────────────────────────────────────
  enableEdit()  { this.editMode = true;  this.snapshot = this.clone(this.form); }
  cancelEdit()  { if (this.snapshot) this.form = this.clone(this.snapshot); this.editMode = false; }
  goBack()      { this.router.navigate(['operador']); }

  async save() {
    if (!this.form.numero_empleado || !this.form.nombres || !this.form.apellidos) {
      this.toast('Completa No. empleado, nombres y apellidos', 'warning');
      return;
    }
    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    this.opSvc.updateOperador(this.idOperador, this.buildPayload()).subscribe({
      next: async () => {
        await loading.dismiss();
        this.toast('Operador actualizado', 'success');
        this.editMode = false;
        this.snapshot = this.clone(this.form);
      },
      error: async (err: any) => {
        await loading.dismiss();
        this.toast(this.parseApiError(err) ?? 'No se pudo actualizar', 'danger');
      }
    });
  }

  private buildPayload(): any {
    return {
      numero_empleado:    this.form.numero_empleado,
      nombres:            this.form.nombres,
      apellidos:          this.form.apellidos,
      fk_zona_actual:     this.form.fk_zona_actual || null,
      fk_tipo_licencia:   this.form.fk_tipo_licencia || null,
      vigencia_licencia:  this.form.vigencia_licencia || null,
      estado_operador:    this.form.estado_operador,
      fk_unidad_asignada: this.form.fk_unidad_asignada ? Number(this.form.fk_unidad_asignada) : null,
      certificaciones:    this.form.certificaciones || [],
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getZonaNombre(id: number | null): string {
    if (!id) return 'Sin zona';
    return this.zonas.find(z => z.id_zona === id)?.nombre_zona ?? `ID ${id}`;
  }
  getUnidadNombre(id: number | null): string {
    if (!id) return 'Sin unidad';
    return this.unidades.find(u => u.id_unidad === id)?.numero_economico ?? `ID ${id}`;
  }
  getLicenciaDescripcion(id: number | null): string {
    if (!id) return '—';
    return this.licencias.find(l => l.id_licencia === id)?.descripcion_licencia ?? '—';
  }
  getCertificacionNombre(id: number): string {
    return this.certificaciones.find(c => c.id_certificacion === id)?.nombre_certificacion ?? `ID ${id}`;
  }
  getInitials(): string {
    return `${this.form.nombres.charAt(0)}${this.form.apellidos.charAt(0)}`.toUpperCase();
  }

  private emptyForm(): OperadorForm {
    return {
      numero_empleado: '', nombres: '', apellidos: '',
      fk_zona_actual: null, fk_tipo_licencia: null,
      vigencia_licencia: '', estado_operador: 'DISPONIBLE',
      fk_unidad_asignada: null, certificaciones: []
    };
  }
  private clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }
  private parseApiError(err: any): string | null {
    const errors = err?.error?.errors;
    if (errors) return Object.values(errors)[0] as string;
    return err?.error?.msg ?? null;
  }
  private async toast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, color, duration: 1600, position: 'top' });
    await t.present();
  }
}