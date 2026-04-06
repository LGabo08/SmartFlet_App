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
import { ViajeService } from 'src/app/services/viaje.service';

import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Ruta } from 'src/models/ruta.model';
import { Licencia } from 'src/models/licencia.model';
import { Certificacion } from 'src/models/certificacion.model';
import { Cliente } from 'src/models/cliente.model';

import {
  ConfirmarViajeModalComponent,
  ConfirmarViajeData,
} from 'src/app/componentes/confirmar-viaje-modal/confirmar-viaje-modal.component';

// ─── Validadores ─────────────────────────────────────────────────────────────

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
  styleUrls: ['./agregar-viaje.page.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, IonicModule, ConfirmarViajeModalComponent],
})
export class AgregarViajePage implements OnInit {
  viajeForm: FormGroup;
  rutas: Ruta[] = [];
  licencias: Licencia[] = [];
  licenciasDisponibles: Licencia[] = [];
  certificaciones: Certificacion[] = [];
  clientes: Cliente[] = [];
  configuracionesUnidad: string[] = ['Configuración 1', 'Configuración 2', 'Configuración 3'];
  saving = false;

  // ── Buscador de rutas ─────────────────────────────────────────────────────
  rutaBusqueda = '';
  rutasFiltradas: Ruta[] = [];
  mostrarDropdown = false;

  // ── Estado del modal de confirmación ─────────────────────────────────────
  showConfirmModal = false;
  confirmData: ConfirmarViajeData | null = null;
  private pendingPayload: any = null;

  constructor(
    private fb: FormBuilder,
    private viajeService: ViajeService,
    private datosViajeService: DatosViajeService,
    private router: Router,
  ) {
    this.viajeForm = this.fb.group({
      numero_viaje: [
        '',
        [Validators.required, Validators.maxLength(50), noScriptValidator, embarqueFormatValidator],
      ],
      fk_ruta: ['', Validators.required],
      configuracion_unidad: ['', Validators.required],
      fk_licencia_requerida: ['', Validators.required],
      producto: [
        '',
        [Validators.required, Validators.maxLength(100), noScriptValidator],
      ],
      cliente: ['', Validators.required],
      certificaciones: [[], Validators.required],
      pago_operador: [
        '',
        [Validators.required, Validators.min(0), Validators.max(9_999_999)],
      ],
    });
  }

  goBack() {
    this.router.navigate(['/viajes']);
  }

  ngOnInit() {
    this.datosViajeService.getRutas().subscribe((data: any) => {
      this.rutas = Array.isArray(data) ? data : [];
    });

    this.datosViajeService.getLicencias().subscribe((data: any) => {
      this.licencias = Array.isArray(data) ? data : [];
      this.licenciasDisponibles = this.licencias;
    });

    this.datosViajeService.getCertificaciones().subscribe((data: any) => {
      this.certificaciones = Array.isArray(data) ? data : [];
    });

    this.datosViajeService.getClientes().subscribe((data: any) => {
      this.clientes = Array.isArray(data) ? data : (data?.clientes ?? []);
    });
  }

  // ── Buscador de rutas ─────────────────────────────────────────────────────

  filtrarRutas(event: Event) {
    const texto = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.mostrarDropdown = true;

    if (!texto) {
      this.viajeForm.patchValue({ fk_ruta: '' });
      this.rutaBusqueda = '';
      this.rutasFiltradas = [];
      this.mostrarDropdown = false;
      return;
    }

    this.rutasFiltradas = this.rutas
      .filter(r => r.nombre_ruta.toLowerCase().includes(texto))
      .slice(0, 10);
  }

  seleccionarRuta(ruta: Ruta) {
    this.viajeForm.patchValue({ fk_ruta: ruta.id_ruta });
    this.rutaBusqueda = ruta.nombre_ruta;
    this.rutasFiltradas = [];
    this.mostrarDropdown = false;
  }

  cerrarDropdown() {
    setTimeout(() => {
      this.mostrarDropdown = false;
      this.rutasFiltradas = [];
      if (!this.viajeForm.get('fk_ruta')?.value) {
        this.rutaBusqueda = '';
      }
    }, 200);
  }

  // ── Configuración de unidad ───────────────────────────────────────────────

  onConfiguracionUnidadChange(configId: string) {
    if (configId === 'Configuración 1' || configId === 'Configuración 2') {
      this.licenciasDisponibles = this.licencias.filter(
        (l) => l.descripcion_licencia === 'Licencia demo Tipo A',
      );
    } else if (configId === 'Configuración 3') {
      this.licenciasDisponibles = this.licencias.filter(
        (l) => l.descripcion_licencia === 'Licencia demo Tipo B',
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

  // ── Submit ────────────────────────────────────────────────────────────────

  onSubmit() {
    this.viajeForm.markAllAsTouched();
    if (this.viajeForm.invalid) return;

    const raw = this.viajeForm.value;

    const rutaObj = this.rutas.find((r) => String(r.id_ruta) === String(raw.fk_ruta));
    const licenciaObj = this.licenciasDisponibles.find(
      (l) => String(l.id_licencia) === String(raw.fk_licencia_requerida),
    );
    const clienteObj = this.clientes.find(
      (c) => String(c.id_cliente) === String(raw.cliente),
    );

    const certIds: number[] = Array.isArray(raw.certificaciones)
      ? raw.certificaciones.map((x: any) => parseInt(x, 10)).filter((n: number) => !isNaN(n))
      : [];

    const certNombres = certIds
      .map(
        (id) =>
          this.certificaciones.find((c) => c.id_certificacion === id)?.nombre_certificacion ?? '',
      )
      .filter(Boolean);

    this.confirmData = {
      numero_viaje: sanitizeString(String(raw.numero_viaje ?? '')),
      rutaNombre: rutaObj?.nombre_ruta ?? String(raw.fk_ruta),
      configuracion_unidad: sanitizeString(raw.configuracion_unidad),
      licenciaNombre:
        licenciaObj?.descripcion_licencia ?? String(raw.fk_licencia_requerida),
      producto: sanitizeString(raw.producto),
      clienteNombre: clienteObj?.nombre_cliente ?? String(raw.cliente),
      certificacionesNombres: certNombres,
      pago_operador: parseFloat(raw.pago_operador),
    };

    this.pendingPayload = {
      numero_viaje: this.confirmData.numero_viaje,
      fk_ruta: parseInt(raw.fk_ruta, 10),
      configuracion_unidad: this.confirmData.configuracion_unidad,
      fk_licencia_requerida: raw.fk_licencia_requerida,
      producto: this.confirmData.producto,
      cliente: clienteObj
        ? sanitizeString(clienteObj.nombre_cliente)
        : sanitizeString(raw.cliente),
      id_cliente: parseInt(raw.cliente, 10),
      estado: 'PENDIENTE',
      certificaciones: certIds,
      pago_operador: parseFloat(raw.pago_operador),
    };

    this.showConfirmModal = true;
  }

  onModalCancelled() {
    this.showConfirmModal = false;
    this.confirmData = null;
    this.pendingPayload = null;
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
    } catch (error) {
      alert('Ocurrió un error inesperado al agregar el viaje.');
      console.error('[AgregarViaje] Error:', error);
    } finally {
      this.saving = false;
    }
  }
}