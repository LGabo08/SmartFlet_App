import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsignacionesViajeService } from 'src/app/services/asignaciones-viaje.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asignaciones',
  templateUrl: './asignaciones.page.html',
  styleUrls: ['./asignaciones.page.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, IonicModule, CommonModule],
})
export class AsignacionesPage implements OnInit {
  viajesPendientes: any[] = [];
  viajesPendientesFiltrados: any[] = [];
  operadores: any[] = [];

  showRechazoModal = false;
  rechazoMotivo = '';

  viajeId: number | null = null;
  viajeSeleccionado: any | null = null;
  operadorRechazoId: number | null = null;

  searchViaje: string = '';

  constructor(
    private asignacionesViajeService: AsignacionesViajeService,
    private router: Router,
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.cargarPendientes();
  }

  cargarPendientes() {
    this.asignacionesViajeService.obtenerViajesPendientes().subscribe({
      next: (response: any) => {
        this.viajesPendientes = response?.viajes ?? [];
        this.viajesPendientesFiltrados = [...this.viajesPendientes];
        this.applyViajeFilter();
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Error al cargar viajes pendientes');
      },
    });
  }

  applyViajeFilter(): void {
    const term = this.searchViaje.trim().toLowerCase();

    this.viajesPendientesFiltrados = this.viajesPendientes.filter((v: any) => {
      const numero = String(v.numero_viaje || '').toLowerCase();
      const ruta = String(v.nombre_ruta || '').toLowerCase();
      const licencia = String(v.nombre_licencia || '').toLowerCase();
      const certificacion = String(v.nombre_certificacion || '').toLowerCase();

      return (
        !term ||
        numero.includes(term) ||
        ruta.includes(term) ||
        licencia.includes(term) ||
        certificacion.includes(term)
      );
    });
  }

  iniciarAsignacion(viajeId: number) {
    this.viajeId = viajeId;

    this.viajeSeleccionado =
      this.viajesPendientes.find((v) => Number(v.id_viaje) === Number(viajeId)) ?? null;

    this.asignacionesViajeService.calcularAsignacion(viajeId).subscribe({
      next: (response: any) => {
        console.log('✅ calcular-asignacion (response):', response);

        if (response?.ok === true) {
          this.operadores = response?.top ?? [];
          if (!this.operadores.length) {
            alert('La asignación se calculó, pero no hubo operadores sugeridos (top vacío).');
          }
          return;
        }

        this.operadores = [];
        const motivo = response?.motivo || response?.msg || 'No se pudo generar asignación';
        alert(motivo);
      },
      error: (err) => {
        console.error('❌ Error HTTP calcular-asignacion:', err);
        this.operadores = [];
        const backendMsg =
          err?.error?.motivo ||
          err?.error?.msg ||
          err?.error?.message ||
          err?.message ||
          'Error HTTP al iniciar la asignación';

        alert(backendMsg);
      },
    });
  }

  asignarViaje(id_viaje: number, id_operador: number) {
    this.asignacionesViajeService.aprobarViaje(id_viaje, id_operador).subscribe({
      next: (response: any) => {
        if (response?.ok) {
          alert('Viaje asignado exitosamente');
          this.operadores = [];
          this.viajeId = null;
          this.viajeSeleccionado = null;
          this.operadorRechazoId = null;
          this.cargarPendientes();
        } else {
          alert(response?.msg || response?.motivo || 'Hubo un error al asignar el viaje');
        }
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Error HTTP al asignar el viaje');
      },
    });
  }

  rechazarViaje(id_viaje: number, id_operador: number) {
    this.viajeId = id_viaje;
    this.operadorRechazoId = id_operador;
    this.rechazoMotivo = '';
    this.showRechazoModal = true;
  }

  confirmarRechazo() {
    if (!this.viajeId) return;

    if (!this.operadorRechazoId) {
      alert('No se detectó el operador a rechazar.');
      return;
    }

    if (!this.rechazoMotivo.trim()) {
      alert('Por favor, ingrese el motivo del rechazo.');
      return;
    }

    this.asignacionesViajeService
      .rechazarViaje(this.viajeId, this.operadorRechazoId, this.rechazoMotivo.trim())
      .subscribe({
        next: (response: any) => {
          if (response?.ok) {
            alert('Motivo de rechazo guardado');
            this.showRechazoModal = false;
            this.operadores = [];
            this.viajeId = null;
            this.viajeSeleccionado = null;
            this.operadorRechazoId = null;
            this.cargarPendientes();
          } else {
            alert(response?.msg || response?.motivo || 'Hubo un error al registrar el rechazo');
          }
        },
        error: (err) => {
          console.error(err);
          alert(err?.error?.message || 'Error HTTP al registrar el rechazo');
        },
      });
  }

  cerrarModalRechazo() {
    this.showRechazoModal = false;
  }

  onModalChange(event: any) {
    this.showRechazoModal = event.detail.value;
  }

  buildCriteriaList(s: any): Array<{ label: string; ok: boolean }> {
    const cuotaRestante = Number(s?.cuota_restante ?? 0);
    const diasSinViaje = Number(s?.dias_sin_viaje ?? 0);
    const tieneUnidad = !!(s?.unidad?.numero_economico || s?.unidad_id);
    const penalizacion = Number(s?.penalizacion ?? 0);

    const licenciaTexto = this.extractBooleanFromTexts(
      s,
      ['licencia compatible', 'licencia requerida', 'licencia válida', 'licencia valida']
    );

    const certificacionTexto = this.extractBooleanFromTexts(
      s,
      ['certificación', 'certificacion']
    );

    return [
      {
        label: 'Licencia requerida compatible',
        ok: licenciaTexto ?? true,
      },
      {
        label: 'Certificación requerida cubierta',
        ok: certificacionTexto ?? true,
      },
      {
        label: 'Cuota restante disponible',
        ok: cuotaRestante > 0,
      },
      {
        label: 'Unidad disponible',
        ok: tieneUnidad,
      },
      {
        label: 'Penalización aceptable',
        ok: penalizacion <= 80,
      },
      {
        label: 'Días sin viaje favorables',
        ok: diasSinViaje >= 1,
      },
    ];
  }

  private extractBooleanFromTexts(s: any, keywords: string[]): boolean | null {
    const texts: string[] = [
      ...(Array.isArray(s?.razones) ? s.razones : []),
      ...(Array.isArray(s?.motivos) ? s.motivos : []),
    ].map((x: any) => String(x || '').toLowerCase());

    if (!texts.length) return null;

    const related = texts.filter((t) => keywords.some((k) => t.includes(k)));
    if (!related.length) return null;

    const negativeWords = ['no ', 'sin ', 'falt', 'incompat', 'inválid', 'invalid', 'rechaz'];
    const hasNegative = related.some((t) => negativeWords.some((n) => t.includes(n)));

    return !hasNegative;
  }
}