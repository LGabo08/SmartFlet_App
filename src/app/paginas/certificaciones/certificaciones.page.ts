import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ModalController } from '@ionic/angular';
import {
  IonButton,
  IonLabel,
  IonItem,
  IonSelect,
  IonSelectOption,
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

@Component({
  selector: 'app-certificaciones',
  standalone: true,
  templateUrl: './certificaciones.page.html',
  styleUrls: ['./certificaciones.page.scss'],
  imports: [
    IonButton,
    IonLabel,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
  ],
  providers: [ModalController]
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
      nombre: ['', Validators.required],
      cliente: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadCertificaciones();
    this.loadClientes();
  }

  loadCertificaciones(): void {
    this.certificacionService.getCertificaciones().subscribe({
      next: (data: Certificacion[]) => {
        this.certificaciones = data;
        this.certificacionesFiltradas = [...this.certificaciones];
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error al cargar certificaciones:', error);
      }
    });
  }

  loadClientes(): void {
    this.datosViajeService.getClientes().subscribe({
      next: (data: Cliente[]) => {
        this.clientes = data;
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  onSubmit() {
    if (this.certificacionesForm.invalid) {
      this.certificacionesForm.markAllAsTouched();
      return;
    }

    const raw = this.certificacionesForm.value;

    const certificacionData: Certificacion = {
      id_certificacion: 0,
      nombre_certificacion: String(raw.nombre || '').trim(),
      descripcion: String(raw.descripcion || '').trim(),
      cliente: raw.cliente,
      fk_cliente: raw.cliente,
    };

    this.saving = true;

    this.certificacionService.createCertificacion(certificacionData).subscribe({
      next: (response) => {
        this.saving = false;

        if (response) {
          alert('Certificación guardada correctamente');
          this.certificacionesForm.reset();
          this.loadCertificaciones();
        } else {
          alert('Error al guardar la certificación');
        }
      },
      error: (error) => {
        this.saving = false;
        alert('Error en el proceso de guardado');
        console.error(error);
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.certificacionesFiltradas = this.certificaciones.filter((cert: Certificacion) => {
      const nombre = String(cert.nombre_certificacion || '').toLowerCase();
      const cliente = String(this.getClienteNombre(cert.fk_cliente) || '').toLowerCase();
      const descripcion = String(cert.descripcion || '').toLowerCase();

      return (
        !term ||
        nombre.includes(term) ||
        cliente.includes(term) ||
        descripcion.includes(term)
      );
    });
  }

  getClienteNombre(clienteId: number): string {
    const cliente = this.clientes.find(c => c.id_cliente === clienteId);
    return cliente ? cliente.nombre_cliente : 'Cliente no encontrado';
  }

  async openEditModal(certificacion: Certificacion) {
    this.selectedCertification = certificacion;

    const modal = await this.modalController.create({
      component: CertificacionModalComponent,
      componentProps: {
        isOpen: true,
        selectedCertification: certificacion,
        clientes: this.clientes,
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadCertificaciones();
      }
    });

    return await modal.present();
  }
}