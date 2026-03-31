import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, personOutline, informationCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { LoadingController, ToastController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonButtons, IonInput, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { IonCheckbox, IonItem, IonList } from '@ionic/angular/standalone';



import { OperadorService } from 'src/app/services/operador.service';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';

import { Licencia } from 'src/models/licencia.model';
import { Zona } from 'src/models/zona.model';

type EstadoOperador = 'DISPONIBLE' | 'NO_DISPONIBLE' | 'INACTIVO';

type OperadorForm = {
  numero_empleado: string;
  nombres: string;
  apellidos: string;
  fk_zona_actual: number | null;
  fk_tipo_licencia: number | null;
  vigencia_licencia: string;
  estado_operador: EstadoOperador;
  certificaciones: number[];
};

type FormErrors = {
  numero_empleado?: string;
  nombres?: string;
  apellidos?: string;
  vigencia_licencia?: string;
  estado_operador?: string;
  certificaciones?: string;
};

@Component({
  selector: 'app-operador-crear',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonButtons,
    IonInput, IonSelect, IonSelectOption,
  ],
  templateUrl: './operador-crear.page.html',
  styleUrls: ['./operador-crear.page.scss'],
})
export class OperadorCrearPage implements OnInit {

  form: OperadorForm = this.emptyForm();
  errors: FormErrors = {};
  submitted = false;

  licencias: Licencia[] = [];
  zonas: Zona[] = [];
  clientes: any[] = [];
  certificacionesFiltradas: any[] = [];

  clienteSeleccionado: number | null = null;
  loadingCerts = false;

  // Rango de años para vigencia — desde hoy hasta 20 años adelante
  minFecha = new Date().toISOString().split('T')[0];
  maxFecha = new Date(new Date().setFullYear(new Date().getFullYear() + 20))
    .toISOString().split('T')[0];

  constructor(
    private router: Router,
    private opSvc: OperadorService,
    private certSvc: DatosViajeService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ arrowBackOutline, personOutline, informationCircleOutline, alertCircleOutline });
  }

  ngOnInit() {
    this.loadCatalogos();
  }

  private loadCatalogos() {
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

    onClienteChange() {
    this.certificacionesFiltradas = [];
    this.errors.certificaciones = undefined;
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

    // Maneja el check/uncheck individual sin reemplazar todo el array
    toggleCertificacion(idCert: number, event: any) {
    const checked = event.detail.checked;
    if (checked) {
        if (!this.form.certificaciones.includes(idCert)) {
        this.form.certificaciones = [...this.form.certificaciones, idCert];
        }
    } else {
        this.form.certificaciones = this.form.certificaciones.filter(id => id !== idCert);
    }
    this.validateField('certificaciones');
    }

    isCertSelected(idCert: number): boolean {
    return this.form.certificaciones.includes(idCert);
    }



  // Validación en tiempo real por campo
  validateField(field: keyof FormErrors) {
    switch (field) {
      case 'numero_empleado':
        if (!this.form.numero_empleado.trim()) {
          this.errors.numero_empleado = 'El No. de empleado es obligatorio.';
        } else if (!/^\d+$/.test(this.form.numero_empleado.trim())) {
          this.errors.numero_empleado = 'Solo se permiten números.';
        } else {
          this.errors.numero_empleado = undefined;
        }
        break;

      case 'nombres':
        if (!this.form.nombres.trim()) {
          this.errors.nombres = 'Los nombres son obligatorios.';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(this.form.nombres.trim())) {
          this.errors.nombres = 'Solo se permiten letras y espacios.';
        } else {
          this.errors.nombres = undefined;
        }
        break;

      case 'apellidos':
        if (!this.form.apellidos.trim()) {
          this.errors.apellidos = 'Los apellidos son obligatorios.';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(this.form.apellidos.trim())) {
          this.errors.apellidos = 'Solo se permiten letras y espacios.';
        } else {
          this.errors.apellidos = undefined;
        }
        break;

      case 'vigencia_licencia':
        if (this.form.vigencia_licencia) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const fecha = new Date(this.form.vigencia_licencia);
          if (fecha < hoy) {
            this.errors.vigencia_licencia = 'La vigencia no puede ser una fecha pasada.';
          } else {
            this.errors.vigencia_licencia = undefined;
          }
        } else {
          this.errors.vigencia_licencia = undefined;
        }
        break;

      case 'certificaciones':
        if (this.clienteSeleccionado && this.form.certificaciones.length === 0) {
          this.errors.certificaciones = 'Selecciona al menos una certificación.';
        } else {
          this.errors.certificaciones = undefined;
        }
        break;
    }
  }

  private validateAll(): boolean {
    this.submitted = true;
    (['numero_empleado', 'nombres', 'apellidos', 'vigencia_licencia', 'certificaciones'] as (keyof FormErrors)[])
      .forEach(f => this.validateField(f));

    if (!this.form.estado_operador) {
      this.errors.estado_operador = 'El estado es obligatorio.';
    } else {
      this.errors.estado_operador = undefined;
    }

    return !Object.values(this.errors).some(e => !!e);
  }

  goBack() { this.router.navigate(['operador']); }

  async save() {
    if (!this.validateAll()) {
      this.toast('Corrige los errores antes de continuar', 'warning');
      return;
    }

    const payload: any = {
      numero_empleado:    this.form.numero_empleado.trim(),
      nombres:            this.form.nombres.trim(),
      apellidos:          this.form.apellidos.trim(),
      fk_zona_actual:     this.form.fk_zona_actual || null,
      fk_tipo_licencia:   this.form.fk_tipo_licencia || null,
      vigencia_licencia:  this.form.vigencia_licencia || null,
      estado_operador:    this.form.estado_operador,
      fk_unidad_asignada: null,
      certificaciones:    this.form.certificaciones || [],
    };

    const loading = await this.loadingCtrl.create({ message: 'Creando operador...' });
    await loading.present();

    this.opSvc.createOperador(payload).subscribe({
      next: async () => {
        await loading.dismiss();
        this.toast('Operador creado exitosamente', 'success');
        this.router.navigate(['operador']);
      },
      error: async (err: any) => {
        await loading.dismiss();
        this.toast(this.parseApiError(err) ?? 'No se pudo crear el operador', 'danger');
      }
    });
  }

  private emptyForm(): OperadorForm {
    return {
      numero_empleado: '', nombres: '', apellidos: '',
      fk_zona_actual: null, fk_tipo_licencia: null,
      vigencia_licencia: '', estado_operador: 'DISPONIBLE',
      certificaciones: []
    };
  }

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