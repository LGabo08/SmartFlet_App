import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  busOutline, addOutline, informationCircleOutline,
  searchOutline, filterOutline, closeCircleOutline
} from 'ionicons/icons';
import { LoadingController, ToastController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonInput, IonSelect, IonSelectOption, IonBadge
} from '@ionic/angular/standalone';

import { UnidadService } from 'src/app/services/unidad.service';
import { OperadorService } from 'src/app/services/operador.service';

@Component({
  selector: 'app-unidades',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, 
  ],
  templateUrl: './unidades.page.html',
  styleUrls: ['./unidades.page.scss'],
})
export class UnidadesPage implements OnInit {

  unidades: any[] = [];
  unidadesFiltradas: any[] = [];
  operadores: any[] = [];

  busqueda = '';
  filtroEstado = '';

  estadosUnidad = ['DISPONIBLE', 'NO_DISPONIBLE', 'EN_VIAJE', 'MANTENIMIENTO', 'BAJA'];

  constructor(
    private unidadSvc: UnidadService,
    private operadorSvc: OperadorService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      busOutline, addOutline, informationCircleOutline,
      searchOutline, filterOutline, closeCircleOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
  this.loadData();
}

  async loadData() {
    const loading = await this.loadingCtrl.create({ message: 'Cargando unidades...' });
    await loading.present();

    this.operadorSvc.getOperadores().subscribe({
      next: (res: any) => {
        this.operadores = Array.isArray(res) ? res : (res?.operadores ?? []);
      }
    });

    this.unidadSvc.getUnidades().subscribe({
      next: async (res: any) => {
        this.unidades = Array.isArray(res) ? res : (res?.unidades ?? []);
        this.aplicarFiltros();
        await loading.dismiss();
      },
      error: async () => {
        await loading.dismiss();
        this.toast('No se pudieron cargar las unidades', 'danger');
      }
    });
  }

  getOperadorId(idUnidad: number): number | null {
  return this.operadores.find(o => o.fk_unidad_asignada === idUnidad)?.id_operador ?? null;
}

goToOperador(idUnidad: number) {
  const id = this.getOperadorId(idUnidad);
  if (id) this.router.navigate(['operadores', id]);
}

  aplicarFiltros() {
    let resultado = [...this.unidades];

    if (this.busqueda.trim()) {
      const q = this.busqueda.trim().toLowerCase();
      resultado = resultado.filter(u =>
        u.numero_economico?.toLowerCase().includes(q) ||
        String(u.id_unidad).includes(q) ||
        this.getOperadorAsignado(u.id_unidad).toLowerCase().includes(q)
      );
    }

    if (this.filtroEstado) {
      resultado = resultado.filter(u => u.estado === this.filtroEstado);
    }

    this.unidadesFiltradas = resultado;
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  get hayFiltrosActivos(): boolean {
    return !!this.busqueda.trim() || !!this.filtroEstado;
  }

  getOperadorAsignado(idUnidad: number): string {
    const op = this.operadores.find(o => o.fk_unidad_asignada === idUnidad);
    if (!op) return 'Sin operador';
    return `${op.nombres ?? ''} ${op.apellidos ?? ''}`.trim();
  }

  getEstadoBadge(estado: string): string {
    const map: Record<string, string> = {
      'DISPONIBLE':    'ok',
      'NO_DISPONIBLE': 'warn',
      'EN_VIAJE':      'travel',
      'MANTENIMIENTO': 'mant',
      'BAJA':          'off',
    };
    return map[estado] ?? '';
  }

  goToDetalle(id: number) {
    this.router.navigate(['unidades', id]);
  }

  goToCrear() {
    this.router.navigate(['paginas/unidad-crear']);
  }

  private async toast(message: string, color: 'success'|'warning'|'danger'|'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, color, duration: 1600, position: 'top' });
    await t.present();
  }
}