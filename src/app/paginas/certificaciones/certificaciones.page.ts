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

function noScriptValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  const dangerous = /<[^>]*>|<script|javascript:|on\w+\s*=|&#|&lt;|&gt;/i;
  return dangerous.test(value) ? { noScript: true } : null;
}

function sanitizeString(value: string): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`;]/g, '')
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
      nombre: [
        '',
        [Validators.required, Validators.maxLength(100), noScriptValidator],
      ],
      cliente: ['', Validators.required],
      descripcion: [
        '',
        [Validators.required, Validators.maxLength(300), noScriptValidator],
      ],
    });
  }

  ngOnInit() {
    this.loadClientes();
  }

  loadClientes(): void {
    this.datosViajeService.getClientes().subscribe({
      next: (data: any) => {
        this.clientes = Array.isArray(data) ? data : (data?.clientes ?? []);
        this.loadCertificaciones();
      },
      error: (error) => {
        console.error('[Certificaciones] Error al cargar clientes:', error);
        this.loadCertificaciones();
      },
    });
  }

  loadCertificaciones(): void {
    this.certificacionService.getCertificaciones().subscribe({
      next: (data: Certificacion[]) => {
        this.certificaciones = Array.isArray(data) ? data : [];
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
      nombre_certificacion: sanitizeString(String(raw.nombre ?? '')),
      descripcion: sanitizeString(String(raw.descripcion ?? '')),
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

  getClienteNombre(clienteId: number | string): string {
    if (clienteId == null || clienteId === '' || clienteId === 0) {
      return 'Sin cliente';
    }
    const cliente = this.clientes.find(
      (c) => String(c.id_cliente) === String(clienteId)
    );
    return cliente ? cliente.nombre_cliente : 'Cliente no encontrado';
  }

  async openEditModal(certificacion: Certificacion) {
    const certCopia: Certificacion = { ...certificacion };

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
        // ✅ FIX: define tamaño del modal para que ion-content renderice
        breakpoints: [0, 1],
        initialBreakpoint: 1,
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
        this.loadCertificaciones();
      }
    });

    await modal.present();
  }
}