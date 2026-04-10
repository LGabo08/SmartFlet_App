import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsignacionesViajeService } from 'src/app/services/asignaciones-viaje.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asignaciones',
  templateUrl: './asignaciones.page.html',
  styleUrls: ['./asignaciones.page.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule, CommonModule],
})
export class AsignacionesPage {
  viajesPendientes:          any[] = [];
  viajesPendientesFiltrados: any[] = [];
  operadores:                any[] = [];

  showRechazoModal = false;
  rechazoMotivo    = '';

  showConfirmModal           = false;
  confirmAdvertencias:        { tipo: 'error' | 'warn'; mensaje: string }[] = [];
  confirmAdvertenciasClaves:  string[]      = [];
  confirmViajeId:             number | null = null;
  confirmOperadorId:          number | null = null;
  confirmOperadorNombre                     = '';

  showEncadenamientoModal     = false;
  encadenamientoOperador:     any | null    = null;
  encadenamientoViajePadreId: number | null = null;

  viajeId:           number | null = null;
  viajeSeleccionado: any    | null = null;
  operadorRechazoId: number | null = null;
  searchViaje = '';

  private pendingRankingInfo:        { pos_elegido: number; pos_mejor: number; nombre_mejor: string } | null = null;
  private pendingViajePadreId:       number | null = null;
  private pendingAdvertenciasClaves: string[]      = [];
  private pendingOperador:           any | null    = null;

  constructor(
    private asignacionesViajeService: AsignacionesViajeService,
    private router: Router,
  ) {}

  ionViewWillEnter() {
    this.cargarPendientes();
  }

  cargarPendientes() {
    this.asignacionesViajeService.obtenerViajesPendientes().subscribe({
      next: (response: any) => {
        this.viajesPendientes          = response?.viajes ?? [];
        this.viajesPendientesFiltrados = [...this.viajesPendientes];
        this.applyViajeFilter();
      },
      error: (err) => alert(err?.error?.message || 'Error al cargar viajes pendientes'),
    });
  }

  applyViajeFilter(): void {
    const term = this.searchViaje.trim().toLowerCase();
    this.viajesPendientesFiltrados = this.viajesPendientes.filter((v: any) =>
      !term ||
      String(v.numero_viaje         || '').toLowerCase().includes(term) ||
      String(v.nombre_ruta          || '').toLowerCase().includes(term) ||
      String(v.nombre_licencia      || '').toLowerCase().includes(term) ||
      String(v.nombre_certificacion || '').toLowerCase().includes(term)
    );
  }

  iniciarAsignacion(viajeId: number) {
    this.viajeId = viajeId;
    this.viajeSeleccionado = this.viajesPendientes.find(
      (v) => Number(v.id_viaje) === Number(viajeId)
    ) ?? null;
    this.operadores = [];

    this.asignacionesViajeService.calcularAsignacion(viajeId).subscribe({
      next: (response: any) => {
        if (response?.ok === true) {
          this.operadores = response?.ranking ?? [];
          if (!this.operadores.length) {
            alert('No hay operadores disponibles para este viaje.');
          }
          return;
        }
        this.operadores = [];
        alert(response?.motivo || response?.msg || 'No se pudo generar asignación');
      },
      error: (err) => {
        this.operadores = [];
        alert(err?.error?.motivo || err?.error?.msg || err?.error?.message || 'Error al iniciar la asignación');
      },
    });
  }

  getRankingPos(s: any): number {
    return this.operadores.indexOf(s) + 1;
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  irAOperador(event: Event, idOperador: number | undefined) {
    event.stopPropagation();
    if (!idOperador) return;
    this.router.navigate(['/paginas/operador-detalle', idOperador]);
  }

  irAUnidad(event: Event, idUnidad: number | undefined) {
    event.stopPropagation();
    if (!idUnidad) return;
    this.router.navigate(['/paginas/unidad-detalle', idUnidad]);
  }

  // ── Helpers del viaje ─────────────────────────────────────────────────────
  getTarifaViaje(v: any): number | null {
    return v?.tarifa_operador ?? v?.pago_operador ?? null;
  }

  // El backend ahora envía id_unidad dentro del objeto unidad (confirmado).
  getIdUnidad(unidad: any): number | undefined {
    return unidad?.id_unidad ?? undefined;
  }

  // ── ¿Operador ya tiene un viaje encadenado pendiente? ────────────────────
  //
  // FUENTE DE VERDAD: el campo tiene_viaje_encadenado_pendiente que ahora
  // viene del backend, calculado desde la tabla viaje_encadenamiento.
  // Si ese campo es true → bloqueado, sin excepción.
  //
  // Regla de negocio:
  //   Un operador EN_VIAJE (viaje padre EN_CURSO) solo puede tener UN viaje
  //   en cola (PENDIENTE/ASIGNADO). Si ya tiene uno, no puede recibir otro.
  operadorYaEncadenado(s: any): boolean {
    return s.tiene_viaje_encadenado_pendiente === true;
  }

  // ── Errores bloqueantes ───────────────────────────────────────────────────
  tieneErrorBloqueante(s: any): boolean {
    const estadoOp = s.operador?.estado_operador ?? '';

    // Bloqueado por el algoritmo Python (duro)
    if (s.bloqueado) return true;

    // Ya tiene un viaje encadenado en cola → no puede recibir otro
    if (this.operadorYaEncadenado(s)) return true;

    // EN_VIAJE y es_encadenable=true → puede encadenarse (backend ya verificó)
    if (estadoOp === 'EN_VIAJE' && s.es_encadenable) return false;

    // DISPONIBLE → puede asignarse
    if (estadoOp === 'DISPONIBLE') return false;

    // Cualquier otro estado → bloqueado
    return true;
  }

  motivosBloqueo(s: any): string[] {
    const motivos: string[] = [];
    const estadoOp = s.operador?.estado_operador ?? '';

    // Este motivo va primero y es el único relevante si aplica
    if (this.operadorYaEncadenado(s)) {
      const num = s.numero_viaje_encadenado_pendiente;
      motivos.push(
        num
          ? `El operador ya tiene el viaje #${num} encadenado en espera — debe iniciarlo primero`
          : 'El operador ya tiene un viaje encadenado pendiente de iniciar'
      );
      return motivos;
    }

    if (estadoOp === 'ASIGNADO') {
      motivos.push('El operador tiene un viaje asignado pero aún no iniciado — no puede encadenarse');
    } else if (estadoOp === 'EN_VIAJE' && !s.es_encadenable) {
      motivos.push('El operador está en viaje pero sin destino registrado para encadenamiento');
    } else if (estadoOp === 'INACTIVO') {
      motivos.push('El operador se encuentra inactivo');
    } else if (estadoOp === 'NO_DISPONIBLE') {
      motivos.push('El operador no está disponible');
    }

    if (!s.unidad_asignada)     motivos.push('El operador no tiene unidad asignada');
    if (s.cuota_restante === 0) motivos.push('Cuota del periodo agotada');

    return motivos;
  }

  // ── Solicitar asignación ──────────────────────────────────────────────────
  solicitarAsignacion(s: any) {
    // Doble verificación: aunque el botón esté habilitado, validamos de nuevo
    if (this.tieneErrorBloqueante(s)) {
      alert(this.motivosBloqueo(s).join('\n'));
      return;
    }

    const mejor = this.operadores[0];
    this.pendingRankingInfo = {
      pos_elegido:  this.getRankingPos(s),
      pos_mejor:    1,
      nombre_mejor: mejor?.operador?.nombre ?? '',
    };
    this.pendingOperador = s;

    // Solo abre el modal si es encadenable Y no tiene ya uno en cola
    if (s.es_encadenable && s.viaje_activo_id && !this.operadorYaEncadenado(s)) {
      this.encadenamientoOperador     = s;
      this.encadenamientoViajePadreId = s.viaje_activo_id;
      this.showEncadenamientoModal    = true;
      return;
    }

    this.continuarConAdvertencias(s, null);
  }

  // Solo una opción: encadenar. "Asignar independiente" eliminado.
  confirmarEncadenamiento() {
    const s          = this.encadenamientoOperador;
    const viajePadre = this.encadenamientoViajePadreId;
    this.showEncadenamientoModal    = false;
    this.encadenamientoOperador     = null;
    this.encadenamientoViajePadreId = null;
    this.continuarConAdvertencias(s, viajePadre);
  }

  cerrarEncadenamientoModal() {
    this.showEncadenamientoModal    = false;
    this.encadenamientoOperador     = null;
    this.encadenamientoViajePadreId = null;
  }

  private continuarConAdvertencias(s: any, viajePadreId: number | null) {
    this.pendingViajePadreId = viajePadreId;

    const advertencias: { tipo: 'error' | 'warn'; mensaje: string }[] = [];
    const claves: string[] = [];
    const estadoUni = s.unidad?.estado_unidad ?? '';

    if (s.es_encadenable && viajePadreId) {
      if (['EN_VIAJE', 'ASIGNADA_A_VIAJE'].includes(estadoUni)) {
        advertencias.push({
          tipo: 'warn',
          mensaje: `La unidad está EN_VIAJE — se liberará al terminar el viaje en curso`,
        });
      }
    } else if (!['DISPONIBLE'].includes(estadoUni)) {
      const mensajes: Record<string, string> = {
        'EN_VIAJE':         'La unidad está actualmente en otro viaje',
        'ASIGNADA_A_VIAJE': 'La unidad está asignada a otro viaje',
        'NO_DISPONIBLE':    'La unidad no está disponible',
        'MANTENIMIENTO':    'La unidad está en mantenimiento',
        'BAJA':             'La unidad está dada de baja',
      };
      advertencias.push({ tipo: 'error', mensaje: mensajes[estadoUni] ?? `La unidad tiene estado: ${estadoUni}` });
      claves.push('unidad_no_disponible');
    }

    if (s.licencia_vencida) {
      advertencias.push({ tipo: 'error', mensaje: `Licencia vencida: ${s.operador?.vigencia_licencia ?? 'N/A'}` });
      claves.push('licencia_vencida');
    }
    if (!s.cumple_licencia) {
      advertencias.push({ tipo: 'warn', mensaje: `No cumple el tipo de licencia requerido (tiene: ${s.operador?.nombre_licencia ?? 'N/A'})` });
      claves.push('licencia_incorrecta');
    }
    if (s.operador_fuera_zona) {
      advertencias.push({ tipo: 'warn', mensaje: `Operador fuera de zona (zona actual: ${s.operador?.nombre_zona ?? 'N/A'})` });
      claves.push('operador_fuera_zona');
    }
    if (s.unidad_fuera_zona) {
      advertencias.push({ tipo: 'warn', mensaje: `Unidad fuera de zona (zona actual: ${s.unidad?.nombre_zona ?? 'N/A'})` });
      claves.push('unidad_fuera_zona');
    }
    if ((s.certificaciones_faltantes?.length ?? 0) > 0) {
      advertencias.push({ tipo: 'warn', mensaje: `Certificaciones faltantes: ${s.certificaciones_faltantes.join(', ')}` });
      claves.push('certificaciones_faltantes');
    }
    if (s.es_encadenable && viajePadreId && s.lejos) {
      advertencias.push({
        tipo: 'warn',
        mensaje: `Operador demasiado lejos — terminará en ${s.zona_efectiva_nombre || ('zona ' + s.zona_efectiva)} antes de tomar este viaje`,
      });
    }

    if (!advertencias.length) {
      this.asignarViaje(this.viajeId!, s.id_operador, [], viajePadreId, this.pendingRankingInfo);
      return;
    }

    this.confirmAdvertencias       = advertencias;
    this.confirmAdvertenciasClaves = claves;
    this.confirmViajeId            = this.viajeId;
    this.confirmOperadorId         = s.id_operador;
    this.confirmOperadorNombre     = s.operador?.nombre ?? `Operador ID ${s.id_operador}`;
    this.pendingAdvertenciasClaves = claves;
    this.showConfirmModal          = true;
  }

  cerrarConfirmModal() {
    this.showConfirmModal          = false;
    this.confirmAdvertencias       = [];
    this.confirmAdvertenciasClaves = [];
    this.confirmViajeId            = null;
    this.confirmOperadorId         = null;
    this.confirmOperadorNombre     = '';
  }

  confirmarAsignacion() {
    if (!this.confirmViajeId || !this.confirmOperadorId) return;
    const viajeId     = this.confirmViajeId;
    const operadorId  = this.confirmOperadorId;
    const claves      = [...this.confirmAdvertenciasClaves];
    const viajePadre  = this.pendingViajePadreId;
    const rankingInfo = this.pendingRankingInfo;
    this.cerrarConfirmModal();
    this.asignarViaje(viajeId, operadorId, claves, viajePadre, rankingInfo);
  }

  asignarViaje(
  id_viaje: number,
  id_operador: number,
  advertencias: string[]      = [],
  viajePadreId: number | null = null,
  rankingInfo:  any           = null
) {
  console.log('📦 Payload aprobar:', {
    id_viaje,
    id_operador,
    advertencias,
    viajePadreId,
    rankingInfo
  });

  this.asignacionesViajeService
    .aprobarViaje(id_viaje, id_operador, advertencias, viajePadreId ?? undefined, rankingInfo)
    .subscribe({
      next: (response: any) => {
        if (response?.ok) {
          const msg = response.data?.es_encadenado
            ? 'Viaje encadenado y asignado exitosamente'
            : 'Viaje asignado exitosamente';
          alert(msg);
          this.resetEstado();
          this.cargarPendientes();
        } else {
          alert(response?.msg || response?.motivo || 'Error al asignar el viaje');
        }
      },
      error: (err) => {
        console.error('❌ Error completo:', err);
        const errores = err?.error?.errors;
        const msg = errores
          ? JSON.stringify(errores)
          : err?.error?.message || err?.error?.msg || 'Error HTTP al asignar el viaje';
        alert(msg);
      },
    });
}

  rechazarViaje(id_viaje: number, id_operador: number) {
    this.viajeId           = id_viaje;
    this.operadorRechazoId = id_operador;
    this.rechazoMotivo     = '';
    this.showRechazoModal  = true;
  }

  confirmarRechazo() {
    if (!this.viajeId || !this.operadorRechazoId) return;
    if (!this.rechazoMotivo.trim()) {
      alert('Por favor, ingrese el motivo del rechazo.');
      return;
    }
    this.asignacionesViajeService
      .rechazarViaje(this.viajeId, this.operadorRechazoId, this.rechazoMotivo.trim())
      .subscribe({
        next: (response: any) => {
          if (response?.ok) {
            this.showRechazoModal = false;
            this.iniciarAsignacion(this.viajeId!);
          } else {
            alert(response?.msg || response?.motivo || 'Error al registrar el rechazo');
          }
        },
        error: (err) => alert(err?.error?.message || 'Error HTTP al registrar el rechazo'),
      });
  }

  cerrarModalRechazo() { this.showRechazoModal = false; }

  private resetEstado() {
    this.operadores                = [];
    this.viajeId                   = null;
    this.viajeSeleccionado         = null;
    this.operadorRechazoId         = null;
    this.pendingRankingInfo        = null;
    this.pendingViajePadreId       = null;
    this.pendingAdvertenciasClaves = [];
    this.pendingOperador           = null;
  }
}