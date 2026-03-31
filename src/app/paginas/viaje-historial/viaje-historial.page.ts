import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AsignacionesViajeService } from 'src/app/services/asignaciones-viaje.service';
import { ViajeService } from 'src/app/services/viaje.service';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';

@Component({
  selector: 'app-viaje-historial',
  templateUrl: './viaje-historial.page.html',
  styleUrls: ['./viaje-historial.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ViajeHistorialPage implements OnInit, ViewWillEnter {
  idViaje!: number;

  viaje: any    = null;
  cargandoViaje = true;
  errorViaje    = false;

  historial: any[] = [];
  cargandoHist  = true;
  errorHist     = false;

  cadena: any[]  = [];
  cargandoCadena = false;

  zonas: any[] = [];

  // ── Modal tarifa ──────────────────────────────────────────────────────────
  showTarifaModal            = false;
  nuevaTarifa: number | null = null;
  guardandoTarifa            = false;

  // ── Modal reasignación ────────────────────────────────────────────────────
  showReasignarModal = false;
  guardandoReasignar = false;

  reasigMoverAmbos         = true;
  reasigCambiarAmbos       = true;
  reasigZonaAmbos:          number | null = null;
  reasigEstadoAmbos         = 'DISPONIBLE';
  reasigLiberarEncadenado   = true;
  reasigViajHijoEncadenado: any | null = null;

  reasignacionForm = {
    nuevo_estado_operador: 'DISPONIBLE',
    nuevo_estado_unidad:   'DISPONIBLE',
    nueva_zona_operador:   null as number | null,
    nueva_zona_unidad:     null as number | null,
  };

  readonly ESTADOS_OPERADOR_REASIGN = ['DISPONIBLE', 'NO_DISPONIBLE', 'INACTIVO'];
  readonly ESTADOS_UNIDAD_REASIGN   = ['DISPONIBLE', 'NO_DISPONIBLE', 'MANTENIMIENTO', 'BAJA'];

  // ── Modal finalizar ───────────────────────────────────────────────────────
  showFinalizarModal = false;
  guardandoFinalizar = false;
  finalizacion: any  = null;

  finalizarForm = {
    tipo_finalizacion:  'CORRECTO',
    fecha_llegada_real: '',
    notas:              '',
  };

  // ── Modal iniciar ─────────────────────────────────────────────────────────
  showIniciarModal = false;
  guardandoIniciar = false;
  fechaInicioViaje = '';

  // ── Modal cancelación ─────────────────────────────────────────────────────
  showCancelModal             = false;
  cancelando                  = false;
  cancelMotivo                = '';
  cancelNuevoEstadoOperador   = 'DISPONIBLE';
  cancelNuevaZonaOperador:     number | null = null;
  cancelNuevoEstadoUnidad     = 'DISPONIBLE';
  cancelNuevaZonaUnidad:       number | null = null;
  cancelMotivoEstadoOperador  = '';
  cancelMotivoEstadoUnidad    = '';

  cancelViajesEncadenados: any[] = [];
  cancelAccionEncadenados: 'continuar' | 'liberar' = 'continuar';
  showPasoEncadenados = false;

  readonly ESTADOS_OPERADOR = ['DISPONIBLE', 'NO_DISPONIBLE', 'INACTIVO'];
  readonly ESTADOS_UNIDAD   = ['DISPONIBLE', 'NO_DISPONIBLE', 'EN_VIAJE', 'MANTENIMIENTO', 'BAJA'];

  readonly EVENTO_LABEL: Record<string, string> = {
    ASIGNACION_OK:               '✅ Asignación exitosa',
    ASIGNACION_CON_ADVERTENCIAS: '⚠️ Asignación con advertencias',
    RECHAZO_OPERADOR:            '🚫 Rechazo de operador',
    CAMBIO_TARIFA:               '💲 Cambio de tarifa',
    CANCELACION_VIAJE:           '🚫 Cancelación de viaje',
    REASIGNACION:                '🔄 Reasignación de viaje',
    FINALIZACION_VIAJE:          '✅ Viaje finalizado',
    INICIO_VIAJE:                '🚀 Viaje iniciado',
    ENCADENAMIENTO_ASIGNADO:     '🔗 Viaje encadenado',
    ENCADENAMIENTO_RANKING:      '📊 Ranking de asignación',
    ENCADENAMIENTO_LIBERADO:     '🔓 Encadenamiento liberado',
    ENCADENAMIENTO_CONTINUADO:   '➡️ Operador continúa encadenado',
  };

  readonly EVENTO_COLOR: Record<string, string> = {
    ASIGNACION_OK:               'success',
    ASIGNACION_CON_ADVERTENCIAS: 'warning',
    RECHAZO_OPERADOR:            'danger',
    CAMBIO_TARIFA:               'primary',
    CANCELACION_VIAJE:           'danger',
    REASIGNACION:                'warning',
    FINALIZACION_VIAJE:          'success',
    INICIO_VIAJE:                'primary',
    ENCADENAMIENTO_ASIGNADO:     'primary',
    ENCADENAMIENTO_RANKING:      'medium',
    ENCADENAMIENTO_LIBERADO:     'warning',
    ENCADENAMIENTO_CONTINUADO:   'primary',
  };

  readonly ADV_LABELS: { key: string; label: string }[] = [
    { key: 'adv_unidad_no_disponible',      label: 'Unidad no disponible'        },
    { key: 'adv_licencia_vencida',          label: 'Licencia vencida'            },
    { key: 'adv_licencia_incorrecta',       label: 'Tipo de licencia incorrecto' },
    { key: 'adv_operador_fuera_zona',       label: 'Operador fuera de zona'      },
    { key: 'adv_unidad_fuera_zona',         label: 'Unidad fuera de zona'        },
    { key: 'adv_cuota_agotada',             label: 'Cuota agotada'               },
    { key: 'adv_certificaciones_faltantes', label: 'Certificaciones faltantes'   },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private asignacionesViajeService: AsignacionesViajeService,
    private viajeService: ViajeService,
    private datosViajeService: DatosViajeService,
  ) {}

  ngOnInit() {
    this.idViaje = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarZonas();
  }

  ionViewWillEnter() {
    this.idViaje = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarViaje();
    this.cargarHistorial();
    this.cargarCadena();
  }

  // ── Cargas ────────────────────────────────────────────────────────────────
  cargarFinalizacion() {
    if (!this.idViaje) return;
    this.asignacionesViajeService.getFinalizacion(this.idViaje).subscribe({
      next: (res: any) => { if (res?.ok) this.finalizacion = res.finalizacion; },
      error: () => { this.finalizacion = null; },
    });
  }

  cargarCadena() {
    this.cargandoCadena = true;
    this.asignacionesViajeService.obtenerCadena(this.idViaje).subscribe({
      next: (res: any) => { this.cadena = res?.cadena ?? []; this.cargandoCadena = false; },
      error: () => { this.cadena = []; this.cargandoCadena = false; },
    });
  }

  cargarViaje() {
    this.cargandoViaje = true;
    this.errorViaje    = false;
    this.viajeService.getViajeById(this.idViaje).subscribe({
      next: (res: any) => { this.viaje = res?.viaje ?? res ?? null; this.cargandoViaje = false; },
      error: () => { this.cargandoViaje = false; this.errorViaje = true; },
    });
  }

  cargarHistorial() {
    this.cargandoHist = true;
    this.errorHist    = false;
    this.asignacionesViajeService.obtenerHistorialViaje(this.idViaje).subscribe({
      next: (res: any) => { this.historial = res?.historial ?? []; this.cargandoHist = false; },
      error: () => { this.cargandoHist = false; this.errorHist = true; },
    });
  }

  cargarZonas() {
    this.datosViajeService.getZonas().subscribe({
      next: (res: any) => this.zonas = Array.isArray(res) ? res : (res?.zonas ?? []),
    });
  }

  // ── Getters ───────────────────────────────────────────────────────────────
  get puedeIniciar(): boolean {
    return (this.viaje?.estado ?? '').toUpperCase() === 'ASIGNADO';
  }

  get puedeFinalizar(): boolean {
    return (this.viaje?.estado ?? '').toUpperCase() === 'EN_CURSO';
  }

  get estaTerminado(): boolean {
    return (this.viaje?.estado ?? '').toUpperCase() === 'TERMINADO';
  }

  // ✅ Solo ASIGNADO — EN_CURSO ya no puede reasignarse
  get puedeReasignar(): boolean {
    return (this.viaje?.estado ?? '').toUpperCase() === 'ASIGNADO';
  }

  get puedeCancelar(): boolean {
    return ['ASIGNADO', 'EN_CURSO', 'PENDIENTE'].includes(
      (this.viaje?.estado ?? '').toUpperCase()
    );
  }

  get esHijoEncadenado(): boolean {
    return !!this.viaje?.fk_viaje_padre ||
      this.cadena.some(
        (e: any) => e.id_hijo === this.idViaje &&
                    ['EN_CURSO', 'ASIGNADO', 'PENDIENTE'].includes(e.estado_padre)
      );
  }

  get puedeEditarTarifa(): boolean {
    return (
      !!this.viaje?.fk_operador &&
      ['ASIGNADO', 'EN_CURSO'].includes((this.viaje?.estado ?? '').toUpperCase())
    );
  }

  get tieneCadena(): boolean {
    return this.cadena.length > 0;
  }

  // ✅ Detecta si este viaje es hijo para bloquear estado/zona en reasignación
  get esViajeHijoReasignar(): boolean {
    if (this.viaje?.fk_viaje_padre != null) return true;
    return this.cadena.some(
      (e: any) => e.id_hijo === this.idViaje &&
                  ['EN_CURSO', 'ASIGNADO', 'PENDIENTE'].includes(e.estado_padre)
    );
  }

  // ── Modal reasignación ────────────────────────────────────────────────────
  onMoverAmbosChange() {
    if (this.reasigMoverAmbos) {
      this.reasignacionForm.nueva_zona_operador = this.reasigZonaAmbos;
      this.reasignacionForm.nueva_zona_unidad   = this.reasigZonaAmbos;
    }
  }

  onCambiarAmbosChange() {
    if (this.reasigCambiarAmbos) {
      this.reasignacionForm.nuevo_estado_operador = this.reasigEstadoAmbos;
      this.reasignacionForm.nuevo_estado_unidad   = this.reasigEstadoAmbos;
    }
  }

  cerrarModalReasignar() {
    this.showReasignarModal       = false;
    this.reasigViajHijoEncadenado = null;
  }

  abrirModalReasignar() {
    this.reasigMoverAmbos          = true;
    this.reasigCambiarAmbos        = true;
    this.reasigZonaAmbos           = null;
    this.reasigEstadoAmbos         = 'DISPONIBLE';
    this.reasigLiberarEncadenado   = true;
    this.reasigViajHijoEncadenado  = null;
    this.reasignacionForm = {
      nuevo_estado_operador: 'DISPONIBLE',
      nuevo_estado_unidad:   'DISPONIBLE',
      nueva_zona_operador:   null,
      nueva_zona_unidad:     null,
    };
    this.showReasignarModal = true;

    if (!this.esViajeHijoReasignar) {
      this.asignacionesViajeService.obtenerCadena(this.idViaje).subscribe({
        next: (res: any) => {
          const hijos = (res?.cadena ?? []).filter(
            (c: any) => c.id_padre === this.idViaje &&
                        ['PENDIENTE', 'ASIGNADO'].includes(c.estado_hijo)
          );
          this.reasigViajHijoEncadenado = hijos.length > 0 ? hijos[0] : null;
        },
        error: () => { this.reasigViajHijoEncadenado = null; },
      });
    }
  }

  confirmarReasignacion() {
    this.guardandoReasignar = true;

    // Caso hijo: solo libera el viaje, op sigue EN_VIAJE con su padre
    if (this.esViajeHijoReasignar) {
      this.asignacionesViajeService.reasignarViaje(this.idViaje, {}).subscribe({
        next: (res: any) => {
          this.guardandoReasignar = false;
          if (res?.ok) {
           this.showReasignarModal = false;
    // ✅ Mensaje correcto — no asumimos el estado resultante
    const msg = res.es_hijo
        ? 'Viaje reasignado. Se restó la tarifa al operador — su estado no fue modificado.'
        : 'Viaje reasignado correctamente.';
    alert(msg);
    this.cargarViaje();
    this.cargarHistorial();
    this.cargarCadena();
          } else alert(res?.msg ?? 'No se pudo reasignar el viaje');
        },
        error: (err: any) => {
          this.guardandoReasignar = false;
          alert(err?.error?.msg ?? 'Error al reasignar el viaje');
        },
      });
      return;
    }

    // Caso normal: sin cadena, usuario elige estado/zona
    const zonaOp    = this.reasigMoverAmbos   ? this.reasigZonaAmbos   : this.reasignacionForm.nueva_zona_operador;
    const zonaUni   = this.reasigMoverAmbos   ? this.reasigZonaAmbos   : this.reasignacionForm.nueva_zona_unidad;
    const estadoOp  = this.reasigCambiarAmbos ? this.reasigEstadoAmbos : this.reasignacionForm.nuevo_estado_operador;
    const estadoUni = this.reasigCambiarAmbos ? this.reasigEstadoAmbos : this.reasignacionForm.nuevo_estado_unidad;

    const payload: any = {};
    if (estadoOp  !== undefined) payload.nuevo_estado_operador = estadoOp;
    if (estadoUni !== undefined) payload.nuevo_estado_unidad   = estadoUni;
    if (zonaOp    != null)       payload.nueva_zona_operador   = zonaOp;
    if (zonaUni   != null)       payload.nueva_zona_unidad     = zonaUni;

    this.asignacionesViajeService.reasignarViaje(this.idViaje, payload).subscribe({
      next: (res: any) => {
        this.guardandoReasignar = false;
        if (res?.ok) {
          this.showReasignarModal = false;
          alert('Viaje reasignado correctamente.');
          this.cargarViaje();
          this.cargarHistorial();
          this.cargarCadena();
        } else alert(res?.msg ?? 'No se pudo reasignar el viaje');
      },
      error: (err: any) => {
        this.guardandoReasignar = false;
        alert(err?.error?.msg ?? 'Error al reasignar el viaje');
      },
    });
  }

  // ── Modal cancelación ─────────────────────────────────────────────────────
  abrirModalCancelar() {
    this.cancelMotivo               = '';
    this.cancelNuevoEstadoOperador  = 'DISPONIBLE';
    this.cancelNuevaZonaOperador    = null;
    this.cancelNuevoEstadoUnidad    = 'DISPONIBLE';
    this.cancelNuevaZonaUnidad      = null;
    this.cancelMotivoEstadoOperador = '';
    this.cancelMotivoEstadoUnidad   = '';
    this.cancelViajesEncadenados    = [];
    this.cancelAccionEncadenados    = 'continuar';
    this.showPasoEncadenados        = false;
    this.showCancelModal            = true;

    // Solo buscar hijos si es padre con operador
    if (this.viaje?.fk_operador && !this.esHijoEncadenado) {
      this.asignacionesViajeService.obtenerCadena(this.idViaje).subscribe({
        next: (res: any) => {
          const hijos = (res?.cadena ?? []).filter(
            (c: any) => c.id_padre === this.idViaje &&
                        ['PENDIENTE', 'ASIGNADO'].includes(c.estado_hijo)
          );
          this.cancelViajesEncadenados = hijos;
          this.showPasoEncadenados     = hijos.length > 0;
        },
        error: () => {},
      });
    }
  }

  cerrarModalCancelar() {
    this.showCancelModal            = false;
    this.cancelMotivo               = '';
    this.cancelNuevoEstadoOperador  = 'DISPONIBLE';
    this.cancelNuevaZonaOperador    = null;
    this.cancelNuevoEstadoUnidad    = 'DISPONIBLE';
    this.cancelNuevaZonaUnidad      = null;
    this.cancelMotivoEstadoOperador = '';
    this.cancelMotivoEstadoUnidad   = '';
    this.cancelViajesEncadenados    = [];
    this.cancelAccionEncadenados    = 'continuar';
    this.showPasoEncadenados        = false;
  }

  confirmarCancelacion() {
    if (!this.cancelMotivo.trim()) {
      alert('El motivo de cancelación es obligatorio.');
      return;
    }
    this.cancelando = true;

    const payload: any = { motivos: this.cancelMotivo.trim() };

    if (this.showPasoEncadenados) {
      payload.accion_viajes_encadenados = this.cancelAccionEncadenados;
    }

    // ✅ Reglas de estado/zona según las nuevas reglas de negocio:
    // - Viaje hijo cancelado → bloqueado (op sigue EN_VIAJE con padre)
    // - Viaje padre EN_CURSO + hijo, cancela solo padre → bloqueado (op queda ASIGNADO)
    // - Todo lo demás → usuario elige
    const esPadreEnCurso   = (this.viaje?.estado ?? '').toUpperCase() === 'EN_CURSO';
    const cancelaSoloPadre = esPadreEnCurso && this.showPasoEncadenados && this.cancelAccionEncadenados === 'continuar';
    const operadorBloqueado = this.esHijoEncadenado || cancelaSoloPadre;

    const operadorLibre =
      !!this.viaje?.fk_operador &&
      !operadorBloqueado &&
      (!this.showPasoEncadenados || this.cancelAccionEncadenados === 'liberar');

    if (operadorLibre) {
      payload.nuevo_estado_operador  = this.cancelNuevoEstadoOperador;
      payload.motivo_cambio_operador = this.cancelMotivoEstadoOperador.trim() || undefined;
      payload.nueva_zona_operador    = this.cancelNuevaZonaOperador ?? undefined;
      payload.nuevo_estado_unidad    = this.cancelNuevoEstadoUnidad;
      payload.motivo_cambio_unidad   = this.cancelMotivoEstadoUnidad.trim() || undefined;
      payload.nueva_zona_unidad      = this.cancelNuevaZonaUnidad ?? undefined;
    }

    this.viajeService.cancelarViaje(this.idViaje, payload).subscribe({
      next: (res: any) => {
        this.cancelando = false;
        if (res?.ok) {
          let msg = 'Viaje cancelado exitosamente.';
          if (res.es_hijo_encadenado) {
            msg += '\nEl operador y la unidad siguen activos en su viaje padre.';
          }
          const afectados = res.viajes_encadenados_afectados ?? 0;
          if (afectados > 0) {
            msg += this.cancelAccionEncadenados === 'liberar'
              ? `\n${afectados} viaje(s) encadenado(s) cancelado(s). El operador quedó libre.`
              : `\nEl operador continúa con ${afectados} viaje(s) encadenado(s) en estado ASIGNADO.`;
          }
          alert(msg);
          this.cerrarModalCancelar();
          this.cargarViaje();
          this.cargarHistorial();
          this.cargarCadena();
        } else {
          alert(res?.msg || 'Error al cancelar el viaje.');
        }
      },
      error: (err: any) => {
        this.cancelando = false;
        alert(err?.error?.msg || err?.error?.message || 'Error al cancelar el viaje.');
      },
    });
  }

  // ── Modal iniciar ─────────────────────────────────────────────────────────
  abrirModalIniciar() {
    this.fechaInicioViaje = new Date().toISOString().slice(0, 16);
    this.showIniciarModal = true;
  }

  cerrarModalIniciar() { this.showIniciarModal = false; }

  confirmarIniciar() {
    if (this.esHijoEncadenado) {
    alert('Este viaje está encadenado. Solo puede iniciarse cuando el viaje padre esté TERMINADO.');
    return;
  }
    if (!this.fechaInicioViaje) { alert('La fecha de inicio es obligatoria.'); return; }
    this.guardandoIniciar = true;
    this.asignacionesViajeService.iniciarViaje(this.idViaje, this.fechaInicioViaje).subscribe({
      next: (res: any) => {
        this.guardandoIniciar = false;
        if (res?.ok) { this.showIniciarModal = false; this.cargarViaje(); this.cargarHistorial(); }
        else alert(res?.msg ?? 'No se pudo iniciar el viaje');
      },
      error: (err: any) => {
        this.guardandoIniciar = false;
        const msg   = err?.error?.msg ?? 'Error al iniciar el viaje';
        const padre = err?.error?.viaje_padre;
        alert(padre ? `${msg}\n\nViaje padre: #${padre.numero_viaje} (${padre.estado})` : msg);
      },
    });
  }

  // ── Modal finalizar ───────────────────────────────────────────────────────
  abrirModalFinalizar() {
    this.finalizarForm = {
      tipo_finalizacion:  'CORRECTO',
      fecha_llegada_real: new Date().toISOString().slice(0, 16),
      notas:              '',
    };
    this.showFinalizarModal = true;
  }

  cerrarModalFinalizar() { this.showFinalizarModal = false; }

  confirmarFinalizar() {
    if (!this.finalizarForm.fecha_llegada_real) { alert('La fecha de llegada es obligatoria.'); return; }
    if (this.finalizarForm.tipo_finalizacion === 'CON_INCIDENCIA' && !this.finalizarForm.notas.trim()) {
      alert('Las notas son obligatorias cuando hay incidencia.'); return;
    }
    this.guardandoFinalizar = true;
    this.asignacionesViajeService.finalizarViaje(this.idViaje, {
      tipo_finalizacion:  this.finalizarForm.tipo_finalizacion,
      fecha_llegada_real: this.finalizarForm.fecha_llegada_real,
      notas: this.finalizarForm.notas || null,
    }).subscribe({
      next: (res: any) => {
        this.guardandoFinalizar = false;
        if (res?.ok) {
          this.showFinalizarModal = false;
          this.cargarViaje();
          this.cargarHistorial();
          this.cargarFinalizacion();
        } else alert(res?.msg ?? 'No se pudo finalizar el viaje');
      },
      error: (err: any) => { this.guardandoFinalizar = false; alert(err?.error?.msg ?? 'Error al finalizar'); },
    });
  }

  // ── Modal tarifa ──────────────────────────────────────────────────────────
  abrirModalTarifa() { this.nuevaTarifa = this.viaje?.pago_operador ?? null; this.showTarifaModal = true; }
  cerrarModalTarifa() { this.showTarifaModal = false; this.nuevaTarifa = null; }

  confirmarCambioTarifa() {
    if (!this.nuevaTarifa || this.nuevaTarifa <= 0) { alert('Ingresa una tarifa válida mayor a 0.'); return; }
    if (Number(this.nuevaTarifa) === Number(this.viaje?.pago_operador ?? 0)) { alert('La tarifa es igual a la actual.'); return; }
    this.guardandoTarifa = true;
    this.asignacionesViajeService.cambiarTarifa(this.idViaje, this.nuevaTarifa).subscribe({
      next: (res: any) => {
        this.guardandoTarifa = false;
        if (res?.ok) {
          this.viaje.pago_operador = this.nuevaTarifa;
          this.cerrarModalTarifa();
          this.cargarHistorial();
          const dif = res.diferencia ?? 0;
          alert(`Tarifa actualizada.\nDiferencia: ${dif >= 0 ? '+' : ''}$${dif}`);
        } else alert(res?.msg || 'Error al actualizar la tarifa');
      },
      error: (err: any) => { this.guardandoTarifa = false; alert(err?.error?.message || 'Error'); },
    });
  }

  // ── Helpers timeline ──────────────────────────────────────────────────────
  advertenciasActivas(inc: any): string[] {
    return this.ADV_LABELS
      .filter(a => inc[a.key] === true || inc[a.key] === 1)
      .map(a => a.label);
  }

  colorEvento(tipo: string): string { return this.EVENTO_COLOR[tipo] ?? 'medium'; }
  labelEvento(tipo: string): string { return this.EVENTO_LABEL[tipo] ?? tipo; }

  parsearDetalleTarifa(detalle: string): { tarifa_anterior: number; tarifa_nueva: number; diferencia: number } | null {
    try { return JSON.parse(detalle); } catch { return null; }
  }

  parsearDetalleEncadenamiento(detalle: string): any | null {
    try { return JSON.parse(detalle); } catch { return null; }
  }

  get nombreOperador(): string {
    if (this.viaje?.operador_nombre) return this.viaje.operador_nombre;
    return [this.viaje?.operador?.nombres ?? '', this.viaje?.operador?.apellidos ?? '']
      .filter(Boolean).join(' ') || 'No asignado';
  }

  get numeroEconomico(): string {
    return this.viaje?.numero_economico ?? this.viaje?.unidad?.numero_economico ?? 'No asignada';
  }

  get nombreRuta(): string {
    return this.viaje?.nombre_ruta ?? this.viaje?.ruta?.nombre_ruta ?? 'Sin ruta';
  }

  get estadoClass(): string {
    switch ((this.viaje?.estado || '').toUpperCase()) {
      case 'ASIGNADO':
      case 'TERMINADO': return 'success';
      case 'PENDIENTE':
      case 'EN_CURSO':  return 'warning';
      case 'CANCELADO': return 'danger';
      default:          return 'medium';
    }
  }
}