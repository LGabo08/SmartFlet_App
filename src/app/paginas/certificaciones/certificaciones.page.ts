import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ModalController } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
} from '@ionic/angular/standalone';

import { CertificacionService } from 'src/app/services/certificacion.service';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';

import { Certificacion } from 'src/models/certificacion.model';
import { Cliente } from 'src/models/cliente.model';

import { CertificacionModalComponent } from 'src/app/componentes/certificacion-modal/certificacion-modal.component';

// ─── Validador: sin HTML/scripts ─────────────────────────────────────────────
function noScriptValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  const dangerous = /<[^>]*>|<script|javascript:|on\w+\s*=|&#|&lt;|&gt;/i;
  return dangerous.test(value) ? { noScript: true } : null;
}

// ─── Sanitiza strings antes de enviar al backend ─────────────────────────────
function sanitizeString(value: string): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')   // strip etiquetas HTML
    .replace(/[<>"'`;]/g, '')  // strip chars peligrosos
    .trim();
}

@Component({
  selector: 'app-certificaciones',
  standalone: true,
  templateUrl: './certificaciones.page.html',
  styleUrls: ['./certificaciones.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
  ],
  // ModalController debe ir en providers para componentes standalone
  providers: [ModalController],
})
export class CertificacionesPage implements OnInit {
  certificacionesForm: FormGroup;

  certificaciones: Certificacion[] = [];
  certificacionesFiltradas: Certificacion[] = [];
  clientes: Cliente[] = [];

  saving = false;
  selectedCertification: Certificacion | null = null;
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private certificacionService: CertificacionService,
    private datosViajeService: DatosViajeService,
    private modalController: ModalController,
  ) {
    this.certificacionesForm = this.fb.group({
      // Nombre: requerido, máx 100 chars, sin scripts
      nombre: [
        '',
        [Validators.required, Validators.maxLength(100), noScriptValidator],
      ],
      // Cliente: requerido (ID numérico, viene de select — no necesita sanitizar)
      cliente: ['', Validators.required],
      // Descripción: requerido, máx 300 chars, sin scripts
      descripcion: [
        '',
        [Validators.required, Validators.maxLength(300), noScriptValidator],
      ],
    });
  }

  ngOnInit() {
    // Cargamos clientes PRIMERO y cuando terminen cargamos certificaciones,
    // así getClienteNombre() ya tiene los datos cuando renderiza la tabla.
    this.loadClientes();
  }

  loadClientes(): void {
    this.datosViajeService.getClientes().subscribe({
      next: (data: any) => {
        // El endpoint puede devolver un array directo o { clientes: [] }
        this.clientes = Array.isArray(data) ? data : (data?.clientes ?? []);
        console.log('[Certificaciones] Clientes cargados:', this.clientes);
        // Ahora cargamos certificaciones para que la resolución de nombres funcione
        this.loadCertificaciones();
      },
      error: (error) => {
        console.error('[Certificaciones] Error al cargar clientes:', error);
        // Cargamos certificaciones de todas formas
        this.loadCertificaciones();
      },
    });
  }

  loadCertificaciones(): void {
    this.certificacionService.getCertificaciones().subscribe({
      next: (data: Certificacion[]) => {
        this.certificaciones = Array.isArray(data) ? data : [];
        console.log('[Certificaciones] Certificaciones cargadas:', this.certificaciones);
        this.applyFilter();
      },
      error: (error) => {
        console.error('[Certificaciones] Error al cargar certificaciones:', error);
      },
    });
  }

  onSubmit() {
    this.certificacionesForm.markAllAsTouched();
    if (this.certificacionesForm.invalid) return;

    const raw = this.certificacionesForm.value;

    const certificacionData: Certificacion = {
      id_certificacion: 0,
      // Sanitizamos los strings antes de enviar
      nombre_certificacion: sanitizeString(String(raw.nombre ?? '')),
      descripcion: sanitizeString(String(raw.descripcion ?? '')),
      // cliente e id vienen de un select controlado — solo parseamos el entero
      cliente: String(raw.cliente),
      fk_cliente: parseInt(raw.cliente, 10),
    };

    this.saving = true;

    this.certificacionService.createCertificacion(certificacionData).subscribe({
      next: (response) => {
        this.saving = false;
        if (response) {
          alert('Certificación guardada correctamente');
          this.certificacionesForm.reset({
            nombre: '',
            cliente: '',
            descripcion: '',
          });
          this.loadCertificaciones();
        } else {
          alert('Error al guardar la certificación');
        }
      },
      error: (error) => {
        this.saving = false;
        alert('Error en el proceso de guardado');
        console.error('[Certificaciones] Error al guardar:', error);
      },
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.certificacionesFiltradas = this.certificaciones.filter((cert: Certificacion) => {
      const nombre = String(cert.nombre_certificacion ?? '').toLowerCase();
      const cliente = this.getClienteNombre(cert.fk_cliente).toLowerCase();
      const descripcion = String(cert.descripcion ?? '').toLowerCase();

      return (
        !term ||
        nombre.includes(term) ||
        cliente.includes(term) ||
        descripcion.includes(term)
      );
    });
  }

  // Busca el nombre del cliente por ID con comparación estricta de tipos
  getClienteNombre(clienteId: number | string): string {
    if (clienteId == null || clienteId === '' || clienteId === 0) {
      return 'Sin cliente';
    }
    // Comparamos como string para evitar problemas de número vs string
    const cliente = this.clientes.find(
      (c) => String(c.id_cliente) === String(clienteId)
    );
    return cliente ? cliente.nombre_cliente : 'Cliente no encontrado';
  }

  async openEditModal(certificacion: Certificacion) {
    // Clonamos para no mutar el objeto original de la lista
    const certCopia: Certificacion = { ...certificacion };

    // Resolvemos el cliente completo
    const clienteSeleccionado = this.clientes.find(
      (c) => String(c.id_cliente) === String(certCopia.fk_cliente)
    );
    certCopia.fk_cliente = clienteSeleccionado?.id_cliente ?? 0;
    certCopia.cliente = clienteSeleccionado?.nombre_cliente ?? '';

    this.selectedCertification = certCopia;

    let modal: HTMLIonModalElement;

    try {
      modal = await this.modalController.create({
        component: CertificacionModalComponent,
        cssClass: 'cert-modal',
        componentProps: {
          isOpen: true,
          selectedCertification: certCopia,
          clientes: this.clientes,
        },
      });
    } catch (err) {
      console.error('[Certificaciones] Error al crear modal:', err);
      return;
    }

    modal.onDidDismiss().then((result) => {
      if (result?.data) {
        // Recarga si hubo cambios
        this.loadCertificaciones();
      }
    });

    await modal.present();
  }
}