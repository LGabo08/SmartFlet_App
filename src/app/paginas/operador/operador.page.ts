import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon,
  IonModal, IonInput, IonSelect, IonSelectOption, IonFab, IonFabButton, IonDatetime
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  closeOutline,
  createOutline,
  add,
  walletOutline,
} from 'ionicons/icons';

import { LoadingController, ToastController } from '@ionic/angular';

import { OperadorService } from 'src/app/services/operador.service';
import { UnidadService } from 'src/app/services/unidad.service';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';

import { Operador } from 'src/models/operador.model';
import { Unidad } from 'src/models/unidad.model';
import { Certificacion } from 'src/models/certificacion.model';
import { Licencia } from 'src/models/licencia.model';

type EstadoOperador = 'DISPONIBLE' | 'NO_DISPONIBLE' | 'INACTIVO';

type OperadorForm = {
  id_operador?: number;
  numero_empleado: string;
  nombres: string;
  apellidos: string;
  fk_zona_actual: number | null;
  fk_tipo_licencia: number | null;
  vigencia_licencia: string;
  estado_operador: EstadoOperador;
  fk_unidad_asignada: number | null;
  certificaciones: number[];
};

@Component({
  selector: 'app-operador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon,
    IonModal, IonInput, IonSelect, IonSelectOption,
    IonFab, IonFabButton, IonDatetime
  ],
  templateUrl: './operador.page.html',
  styleUrls: ['./operador.page.scss'],
})
export class OperadorPage implements OnInit {

  operadores: Operador[] = [];
  unidades: Unidad[] = [];
  certificaciones: Certificacion[] = [];
  licencias: Licencia[] = [];

  showModal = false;
  editMode = false;
  isCreate = false;

  form: OperadorForm = this.emptyForm();
  private snapshotForm: OperadorForm | null = null;

  selectedCertificacionId: number | null = null;

  constructor(
    private opSvc: OperadorService,
    private unidadSvc: UnidadService,
    private certSvc: DatosViajeService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({
      informationCircleOutline,
      closeOutline,
      createOutline,
      add,
      walletOutline
    });
  }

  ngOnInit(): void {
    this.loadCatalogos();
    this.loadOperadores();
  }

  private loadCatalogos() {
    this.unidadSvc.getUnidades().subscribe({
      next: (res: any) => {
        this.unidades = Array.isArray(res) ? res : (res?.unidades ?? []);
      },
      error: () => this.toast('No se pudieron cargar unidades', 'warning')
    });

    this.certSvc.getCertificaciones().subscribe({
      next: (res: any) => {
        this.certificaciones = Array.isArray(res) ? res : (res?.certificaciones ?? res?.data ?? []);
      },
      error: () => this.toast('No se pudieron cargar certificaciones', 'warning')
    });

    this.certSvc.getLicencias().subscribe({
      next: (res: any) => {
        this.licencias = Array.isArray(res) ? res : (res?.licencias ?? res?.data ?? []);
      },
      error: () => this.toast('No se pudieron cargar licencias', 'warning')
    });
  }

  async loadOperadores() {
    const loading = await this.loadingCtrl.create({ message: 'Cargando operadores...' });
    await loading.present();

    this.opSvc.getOperadores().subscribe({
      next: async (res: any) => {
        this.operadores = Array.isArray(res) ? res : (res?.operadores ?? []);
        await loading.dismiss();
      },
      error: async () => {
        await loading.dismiss();
        this.toast('No se pudieron cargar operadores', 'danger');
      }
    });
  }

  async goToCuotas(o: Operador) {
    const idOperador = Number(o?.id_operador);

    if (!idOperador) {
      this.toast('Este operador no tiene un ID válido para consultar cuotas', 'warning');
      console.error('Operador sin id_operador válido:', o);
      return;
    }

    const nombreCompleto = `${o?.nombres ?? ''} ${o?.apellidos ?? ''}`.trim();

    console.log('Navegando a cuotas del operador:', {
      id_operador: idOperador,
      nombre: nombreCompleto,
      numero_empleado: o?.numero_empleado
    });

    await this.router.navigate(['paginas/cuotas-operador', idOperador], {
      queryParams: {
        nombre: nombreCompleto,
        numero_empleado: o?.numero_empleado ?? ''
      }
    });
  }

  openInfo(id: number) {
    this.isCreate = false;
    this.editMode = false;

    this.opSvc.getOperador(id).subscribe({
      next: (res: any) => {
        const o: any = res?.operador ?? res;

        this.form = {
          id_operador: o.id_operador,
          numero_empleado: o.numero_empleado ?? '',
          nombres: o.nombres ?? '',
          apellidos: o.apellidos ?? '',
          fk_zona_actual: o.fk_zona_actual ?? null,
          fk_tipo_licencia: o.fk_tipo_licencia ?? null,
          vigencia_licencia: o.vigencia_licencia ?? '',
          estado_operador: (o.estado_operador ?? 'DISPONIBLE') as EstadoOperador,
          fk_unidad_asignada: o.fk_unidad_asignada ?? null,
          certificaciones: o.certificaciones
            ? o.certificaciones.map((cert: any) => cert.id_certificacion)
            : []
        };

        this.snapshotForm = this.clone(this.form);
        this.showModal = true;
      },
      error: () => this.toast('No se pudo cargar el operador', 'danger')
    });
  }

  openCreate() {
    this.isCreate = true;
    this.editMode = true;

    this.form = this.emptyForm();
    this.selectedCertificacionId = null;

    this.snapshotForm = this.clone(this.form);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editMode = false;
    this.isCreate = false;
  }

  enableEdit() {
    this.editMode = true;
    this.snapshotForm = this.clone(this.form);
  }

  cancelEdit() {
    if (this.snapshotForm) {
      this.form = this.clone(this.snapshotForm);
    }
    if (!this.isCreate) this.editMode = false;
  }

  async save() {
    console.log('Datos del formulario:', this.form);

    if (!this.form.numero_empleado || !this.form.nombres || !this.form.apellidos) {
      this.toast('Completa No. empleado, nombres y apellidos', 'warning');
      return;
    }

    const payload: any = {
      numero_empleado: this.form.numero_empleado,
      nombres: this.form.nombres,
      apellidos: this.form.apellidos,
      fk_zona_actual: this.form.fk_zona_actual || null,
      fk_tipo_licencia: this.form.fk_tipo_licencia || null,
      vigencia_licencia: this.form.vigencia_licencia || null,
      estado_operador: this.form.estado_operador,
      fk_unidad_asignada: this.form.fk_unidad_asignada ? Number(this.form.fk_unidad_asignada) : null,
      certificaciones: this.form.certificaciones || [],
    };

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    if (this.isCreate) {
      this.opSvc.createOperador(payload).subscribe({
        next: async () => {
          await loading.dismiss();
          this.toast('Operador creado', 'success');
          this.closeModal();
          this.loadOperadores();
        },
        error: async (err: any) => {
          await loading.dismiss();
          this.toast(this.parseApiError(err) ?? 'No se pudo crear', 'danger');
        }
      });
      return;
    }

    if (!this.form.id_operador) {
      await loading.dismiss();
      this.toast('ID de operador inválido', 'danger');
      return;
    }

    this.opSvc.updateOperador(this.form.id_operador, payload).subscribe({
      next: async () => {
        await loading.dismiss();
        this.toast('Operador actualizado', 'success');
        this.closeModal();
        this.loadOperadores();
      },
      error: async (err: any) => {
        await loading.dismiss();
        this.toast(this.parseApiError(err) ?? 'No se pudo actualizar', 'danger');
      }
    });
  }

  getUnidadNombre(id: number | null): string {
    if (!id) return 'Sin unidad';
    const u = this.unidades.find(x => x.id_unidad === id);
    return u?.numero_economico ?? `ID ${id}`;
  }

  getCertificacionNombre(id: number | null): string {
    if (!id) return 'Sin certificación';
    const c = this.certificaciones.find(x => x.id_certificacion === id);
    return c?.nombre_certificacion ?? `ID ${id}`;
  }

  private emptyForm(): OperadorForm {
    return {
      numero_empleado: '',
      nombres: '',
      apellidos: '',
      fk_zona_actual: null,
      fk_tipo_licencia: null,
      vigencia_licencia: '',
      estado_operador: 'DISPONIBLE',
      fk_unidad_asignada: null,
      certificaciones: []
    };
  }

  private parseApiError(err: any): string | null {
    const errors = err?.error?.errors;
    if (errors && typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0];
      return errors[firstKey]?.[0] ?? null;
    }
    return err?.error?.msg ?? null;
  }

  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private async toast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'medium' = 'medium'
  ) {
    const t = await this.toastCtrl.create({
      message,
      color,
      duration: 1600,
      position: 'top'
    });
    await t.present();
  }
}