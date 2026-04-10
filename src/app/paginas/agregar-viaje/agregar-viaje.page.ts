import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';
import { ViajeService }      from 'src/app/services/viaje.service';

import { IonicModule }        from '@ionic/angular';
import { CommonModule }       from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { Ruta }          from 'src/models/ruta.model';
import { Licencia }      from 'src/models/licencia.model';
import { Certificacion } from 'src/models/certificacion.model';
import { Cliente }       from 'src/models/cliente.model';

import {
  ConfirmarViajeModalComponent,
  ConfirmarViajeData,
} from 'src/app/componentes/confirmar-viaje-modal/confirmar-viaje-modal.component';

// ── Configurador Excel ────────────────────────────────────────────────────────
import { ExcelImportConfiguratorComponent } from 'src/app/componentes/excel-import-configurator/excel-import-configurator.component';

// ─── Validadores ──────────────────────────────────────────────────────────────
function noScriptValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  const dangerous = /<[^>]*>|<script|javascript:|on\w+\s*=|&#|&lt;|&gt;/i;
  return dangerous.test(value) ? { noScript: true } : null;
}

function embarqueFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value ?? '').trim();
  const valid = /^[a-zA-Z0-9\-\.]+$/.test(value);
  return value && !valid ? { embarqueFormat: true } : null;
}

function sanitizeString(value: string): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`;]/g, '')
    .trim();
}

@Component({
  selector: 'app-agregar-viaje',
  standalone: true,
  templateUrl: './agregar-viaje.page.html',
  styleUrls:  ['./agregar-viaje.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    ConfirmarViajeModalComponent,
    ExcelImportConfiguratorComponent,
  ],
})
export class AgregarViajePage implements OnInit {

  // ── Formulario manual ──────────────────────────────────────────────────────
  viajeForm: FormGroup;
  rutas:                Ruta[]          = [];
  licencias:            Licencia[]      = [];
  licenciasDisponibles: Licencia[]      = [];
  certificaciones:      Certificacion[] = [];
  clientes:             Cliente[]       = [];

  // ── Configuraciones de unidad actualizadas ─────────────────────────────────
  configuracionesUnidad: string[] = ['Sencillo', 'Doble', 'Encortinado'];

  saving = false;

  showConfirmModal = false;
  confirmData: ConfirmarViajeData | null = null;
  private pendingPayload: any = null;

  // ── Modo de ingreso ────────────────────────────────────────────────────────
  /** 'manual' | 'excel' */
  modoIngreso: 'manual' | 'excel' = 'manual';

  /** Controla si el panel configurador Excel está abierto */
  mostrarConfigurador = false;

  /** Resultado de la última carga masiva */
  resultadoCarga: { ok: number; errores: number } | null = null;

  constructor(
    private fb:               FormBuilder,
    private viajeService:     ViajeService,
    private datosViajeService: DatosViajeService,
    private router:           Router,
  ) {
    this.viajeForm = this.fb.group({
      numero_viaje: [
        '',
        [Validators.required, Validators.maxLength(50), noScriptValidator, embarqueFormatValidator],
      ],
      fk_ruta:               ['', Validators.required],
      configuracion_unidad:  ['', Validators.required],
      fk_licencia_requerida: ['', Validators.required],
      producto: [
        '',
        [Validators.required, Validators.maxLength(100), noScriptValidator],
      ],
      cliente:        ['', Validators.required],
      certificaciones: [],
      pago_operador: [
        '',
        [Validators.required, Validators.min(0), Validators.max(9_999_999)],
      ],
    });
  }

  goBack() { this.router.navigate(['/viajes']); }

  ngOnInit() {
    this.datosViajeService.getRutas().subscribe((data: any) => {
      this.rutas = Array.isArray(data) ? data : [];
    });
    this.datosViajeService.getLicencias().subscribe((data: any) => {
      this.licencias            = Array.isArray(data) ? data : [];
      this.licenciasDisponibles = this.licencias;
    });
    this.datosViajeService.getCertificaciones().subscribe((data: any) => {
      this.certificaciones = Array.isArray(data) ? data : [];
    });
    this.datosViajeService.getClientes().subscribe((data: any) => {
      this.clientes = Array.isArray(data) ? data : (data?.clientes ?? []);
    });
  }

  // ── Formulario manual ──────────────────────────────────────────────────────

  /**
   * Mapeo de configuración de unidad → licencia requerida.
   *
   * Sencillo  → Tipo A  (id_licencia = 1)
   * Doble     → Tipo A  (id_licencia = 1)
   * Encortinado → Tipo B (id_licencia = 2)
   *
   * El algoritmo compara por fk_licencia_requerida (ID numérico),
   * por lo que cambiar los textos aquí no lo afecta.
   */
  onConfiguracionUnidadChange(configId: string) {
    if (configId === 'Sencillo' || configId === 'Doble') {
      this.licenciasDisponibles = this.licencias.filter(
        l => l.descripcion_licencia === 'Tipo A',
      );
    } else if (configId === 'Encortinado') {
      this.licenciasDisponibles = this.licencias.filter(
        l => l.descripcion_licencia === 'Tipo B',
      );
    } else {
      this.licenciasDisponibles = [];
    }
    this.viajeForm.patchValue({ fk_licencia_requerida: '' });
  }

  onClienteChange(event: Event) {
    const clienteId = (event.target as HTMLSelectElement).value;
    if (!clienteId) return;
    this.datosViajeService
      .getCertificacionesPorCliente(Number(clienteId))
      .subscribe((data: any) => {
        this.certificaciones = Array.isArray(data) ? data : [];
      });
    this.viajeForm.patchValue({ certificaciones: [] });
  }

  onSubmit() {
    this.viajeForm.markAllAsTouched();
    if (this.viajeForm.invalid) return;

    const raw = this.viajeForm.value;

    const rutaObj     = this.rutas.find(r => String(r.id_ruta) === String(raw.fk_ruta));
    const licenciaObj = this.licenciasDisponibles.find(
      l => String(l.id_licencia) === String(raw.fk_licencia_requerida),
    );
    const clienteObj  = this.clientes.find(c => String(c.id_cliente) === String(raw.cliente));

    const certIds: number[] = Array.isArray(raw.certificaciones)
      ? raw.certificaciones.map((x: any) => parseInt(x, 10)).filter((n: number) => !isNaN(n))
      : [];

    const certNombres = certIds
      .map(id => this.certificaciones.find(c => c.id_certificacion === id)?.nombre_certificacion ?? '')
      .filter(Boolean);

    this.confirmData = {
      numero_viaje:           sanitizeString(String(raw.numero_viaje ?? '')),
      rutaNombre:             rutaObj?.nombre_ruta ?? String(raw.fk_ruta),
      configuracion_unidad:   sanitizeString(raw.configuracion_unidad),
      licenciaNombre:         licenciaObj?.descripcion_licencia ?? String(raw.fk_licencia_requerida),
      producto:               sanitizeString(raw.producto),
      clienteNombre:          clienteObj?.nombre_cliente ?? String(raw.cliente),
      certificacionesNombres: certNombres,
      pago_operador:          parseFloat(raw.pago_operador),
    };

    this.pendingPayload = {
      numero_viaje:          this.confirmData.numero_viaje,
      fk_ruta:               parseInt(raw.fk_ruta, 10),
      configuracion_unidad:  this.confirmData.configuracion_unidad,
      fk_licencia_requerida: raw.fk_licencia_requerida,
      producto:              this.confirmData.producto,
      cliente:               clienteObj ? sanitizeString(clienteObj.nombre_cliente) : sanitizeString(raw.cliente),
      id_cliente:            parseInt(raw.cliente, 10),
      estado:                'PENDIENTE',
      certificaciones:       certIds,
      pago_operador:         parseFloat(raw.pago_operador),
    };

    this.showConfirmModal = true;
  }

  onModalCancelled() {
    this.showConfirmModal = false;
    this.confirmData      = null;
    this.pendingPayload   = null;
  }

  async onModalConfirmed() {
    if (!this.pendingPayload) return;
    this.saving = true;
    try {
      const res = await this.viajeService.createViaje(this.pendingPayload).toPromise();
      if (res?.ok) {
        this.showConfirmModal = false;
        await this.router.navigate(['/viajes']);
      } else {
        alert('Error al agregar el viaje. Por favor intenta de nuevo.');
      }
    } catch {
      alert('Ocurrió un error inesperado al agregar el viaje.');
    } finally {
      this.saving = false;
    }
  }

  // ── Integración configurador Excel ────────────────────────────────────────

  abrirConfigurador() {
    this.mostrarConfigurador = true;
    this.resultadoCarga      = null;
  }

  cerrarConfigurador() {
    this.mostrarConfigurador = false;
  }

  onCargaCompletada(resultado: { ok: number; errores: number }) {
    this.mostrarConfigurador = false;
    this.resultadoCarga      = resultado;
    if (resultado.errores === 0 && resultado.ok > 0) {
      setTimeout(() => this.router.navigate(['/viajes']), 3000);
    }
  }

  /**
   * Función que se pasa al configurador para que llame al API.
   * Encapsula el servicio de Angular en una Promise.
   */
  readonly createViajeFn = (payload: any): Promise<any> =>
    this.viajeService.createViaje(payload).toPromise();
}