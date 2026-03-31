import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Zona } from 'src/models/zona.model';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonModal, IonInput, IonSelect, IonSelectOption,
  IonFab, IonFabButton, IonDatetime, IonButton, IonIcon, IonButtons,
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
import { OperadorCuotaService, OperadorCuota } from 'src/app/services/operador-cuota.service';

import { Operador } from 'src/models/operador.model';
import { Unidad } from 'src/models/unidad.model';
import { Certificacion } from 'src/models/certificacion.model';
import { Licencia } from 'src/models/licencia.model';

type EstadoOperador = 'DISPONIBLE' | 'NO_DISPONIBLE' | 'INACTIVO' | 'EN_VIAJE';

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
    IonButton, IonIcon, IonButtons,
    IonModal, IonInput, IonSelect, IonSelectOption,
     IonDatetime,
  ],
  templateUrl: './operador.page.html',
  styleUrls: ['./operador.page.scss'],
})
export class OperadorPage implements OnInit {

  operadores: Operador[] = [];
  unidades: Unidad[] = [];
  certificaciones: Certificacion[] = [];
  licencias: Licencia[] = [];
  zonas: Zona[] = [];
  
  // Mapa: id_operador → cuota más reciente
  cuotasMap: Record<number, OperadorCuota> = {};

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
    private cuotaSvc: OperadorCuotaService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({
      informationCircleOutline,
      closeOutline,
      createOutline,
      add,
      walletOutline,
    });
  }

  ngOnInit(): void {
    this.loadCatalogos();
    this.loadOperadores();
    this.loadZonas();
  }

  ionViewWillEnter() {
  this.loadOperadores();
}

goToUnidad(id: number) {
  this.router.navigate(['unidad', id]);
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
        // Una vez cargados los operadores, cargar cuotas de cada uno
        this.loadCuotasParaTodos();
      },
      error: async () => {
        await loading.dismiss();
        this.toast('No se pudieron cargar operadores', 'danger');
      }
    });
  }

  // Carga cuotas para todos los operadores en paralelo
  private loadCuotasParaTodos() {
    this.operadores.forEach(o => {
      const id = o.id_operador;
      if (!id) return;

      this.cuotaSvc.getCuotasPorOperador(id).subscribe({
        next: (res: any) => {
          // La API puede devolver array o { cuotas: [] }
          const lista: OperadorCuota[] = Array.isArray(res)
            ? res
            : (res?.cuotas ?? res?.data ?? []);

          if (lista.length > 0) {
            // Tomamos la cuota más reciente por periodo
            const reciente = lista.sort((a, b) =>
              (b.periodo ?? '').localeCompare(a.periodo ?? '')
            )[0];
            this.cuotasMap[id] = reciente;
          }
        },
        error: () => {
          // Si falla silenciosamente no bloqueamos la lista
        }
      });
    });
  }

  // Helpers para acceder a cuotas desde el template
  getCuotaObjetivo(idOperador: number | undefined): string {
    if (!idOperador) return '—';
    const c = this.cuotasMap[idOperador];
    return c ? `$${c.cuota_objetivo.toLocaleString()}` : '—';
  }

  getCuotaRestante(idOperador: number | undefined): string {
    if (!idOperador) return '—';
    const c = this.cuotasMap[idOperador];
    return c ? `$${(c.cuota_restante ?? 0).toLocaleString()}` : '—';
  }

  getEstadoCuota(idOperador: number | undefined): string {
    if (!idOperador) return '';
    return this.cuotasMap[idOperador]?.estado_cuota ?? '';
  }

  async goToCuotas(o: Operador) {
    const idOperador = Number(o?.id_operador);

    if (!idOperador) {
      this.toast('Este operador no tiene un ID válido para consultar cuotas', 'warning');
      return;
    }

    const nombreCompleto = `${o?.nombres ?? ''} ${o?.apellidos ?? ''}`.trim();

    await this.router.navigate(['paginas/cuotas-operador', idOperador], {
      queryParams: {
        nombre: nombreCompleto,
        numero_empleado: o?.numero_empleado ?? ''
      }
    });
  }

  // openInfo(id: number) {
  //   this.isCreate = false;
  //   this.editMode = false;

  //   this.opSvc.getOperador(id).subscribe({
  //     next: (res: any) => {
  //       const o: any = res?.operador ?? res;

  //       this.form = {
  //         id_operador: o.id_operador,
  //         numero_empleado: o.numero_empleado ?? '',
  //         nombres: o.nombres ?? '',
  //         apellidos: o.apellidos ?? '',
  //         fk_zona_actual: o.fk_zona_actual ?? null,
  //         fk_tipo_licencia: o.fk_tipo_licencia ?? null,
  //         vigencia_licencia: o.vigencia_licencia ?? '',
  //         estado_operador: (o.estado_operador ?? 'DISPONIBLE') as EstadoOperador,
  //         fk_unidad_asignada: o.fk_unidad_asignada ?? null,
  //         certificaciones: o.certificaciones
  //           ? o.certificaciones.map((cert: any) => cert.id_certificacion)
  //           : []
  //       };

  //       this.snapshotForm = this.clone(this.form);
  //       this.showModal = true;
  //     },
  //     error: () => this.toast('No se pudo cargar el operador', 'danger')
  //   });
  // }


  openInfo(id: number) {
  this.router.navigate(['operadores', id]);
}

 openCreate() {
  this.router.navigate(['paginas/operador-crear']);
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

  getLicenciaDescripcion(licenciaId: number): string {
    const l = this.licencias.find(x => x.id_licencia === licenciaId);
    return l ? l.descripcion_licencia : '';
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

  getZonaNombre(zonaId: number | null): string {
    if (!zonaId) return 'Sin zona';
    const z = this.zonas.find(z => z.id_zona === zonaId);
    return z ? z.nombre_zona : 'Zona desconocida';
  }

  private loadZonas() {
    this.certSvc.getZonas().subscribe({
      next: (res: any) => {
        this.zonas = Array.isArray(res) ? res : (res?.zonas ?? []);
      },
      error: () => this.toast('No se pudieron cargar las zonas', 'warning')
    });
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