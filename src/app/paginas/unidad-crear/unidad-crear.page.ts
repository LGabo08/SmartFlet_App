import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, busOutline,
  alertCircleOutline, informationCircleOutline
} from 'ionicons/icons';
import { LoadingController, ToastController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonButtons, IonInput, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

import { UnidadService } from 'src/app/services/unidad.service';

type FormErrors = {
  id_unidad?:        string;
  numero_economico?: string;
  estado?:           string;
  fk_zona_actual?:   string;
};

@Component({
  selector: 'app-unidad-crear',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonButtons,
    IonInput, IonSelect, IonSelectOption,
  ],
  templateUrl: './unidad-crear.page.html',
  styleUrls: ['./unidad-crear.page.scss'],
})
export class UnidadCrearPage implements OnInit {

  form = {
    id_unidad:             '' as any,
    numero_economico:      '',
    estado:                'DISPONIBLE',
    fk_zona_actual:        null as number | null,
    fk_licencia_requerida: null as number | null,
  };

  errors: FormErrors = {};
  submitted = false;

  zonas:    any[] = [];
  licencias: any[] = [];

  estadosUnidad = ['DISPONIBLE', 'NO_DISPONIBLE', 'MANTENIMIENTO', 'BAJA'];

  constructor(
    private router: Router,
    private unidadSvc: UnidadService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ arrowBackOutline, busOutline, alertCircleOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.loadCatalogos();
  }

  private loadCatalogos() {
    this.unidadSvc.getZonas().subscribe({
      next: (res: any) => this.zonas = Array.isArray(res) ? res : (res?.zonas ?? [])
    });
    this.unidadSvc.getLicencias().subscribe({
      next: (res: any) => this.licencias = Array.isArray(res) ? res : (res?.licencias ?? [])
    });
  }

  validateField(field: keyof FormErrors) {
    switch (field) {
      case 'id_unidad':
        if (!String(this.form.id_unidad).trim()) {
          this.errors.id_unidad = 'El ID de la unidad es obligatorio.';
        } else if (!/^\d+$/.test(String(this.form.id_unidad).trim())) {
          this.errors.id_unidad = 'Solo se permiten números.';
        } else {
          this.errors.id_unidad = undefined;
        }
        break;

      case 'numero_economico':
        if (!this.form.numero_economico.trim()) {
          this.errors.numero_economico = 'El número económico es obligatorio.';
        } else {
          this.errors.numero_economico = undefined;
        }
        break;

      case 'estado':
        if (!this.form.estado) {
          this.errors.estado = 'El estado es obligatorio.';
        } else {
          this.errors.estado = undefined;
        }
        break;

      case 'fk_zona_actual':
        if (!this.form.fk_zona_actual) {
          this.errors.fk_zona_actual = 'La zona es obligatoria.';
        } else {
          this.errors.fk_zona_actual = undefined;
        }
        break;
    }
  }

  private validateAll(): boolean {
    this.submitted = true;
    (['id_unidad', 'numero_economico', 'estado', 'fk_zona_actual'] as (keyof FormErrors)[])
      .forEach(f => this.validateField(f));
    return !Object.values(this.errors).some(e => !!e);
  }

  goBack() { this.router.navigate(['unidades']); }

  async save() {
    if (!this.validateAll()) {
      this.toast('Corrige los errores antes de continuar', 'warning');
      return;
    }

    const payload = {
      id_unidad:             Number(this.form.id_unidad),
      numero_economico:      this.form.numero_economico.trim(),
      estado:                this.form.estado,
      fk_zona_actual:        this.form.fk_zona_actual,
      fk_licencia_requerida: this.form.fk_licencia_requerida || null,
    };

    const loading = await this.loadingCtrl.create({ message: 'Creando unidad...' });
    await loading.present();

    this.unidadSvc.createUnidad(payload as any).subscribe({
      next: async () => {
        await loading.dismiss();
        this.toast('Unidad creada exitosamente', 'success');
        this.router.navigate(['paginas/unidades']);
      },
      error: async (err: any) => {
        await loading.dismiss();
        const msg = err?.error?.errors
          ? Object.values(err.error.errors)[0] as string
          : (err?.error?.msg ?? 'No se pudo crear la unidad');
        this.toast(msg, 'danger');
      }
    });
  }

  private async toast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, color, duration: 1600, position: 'top' });
    await t.present();
  }
}