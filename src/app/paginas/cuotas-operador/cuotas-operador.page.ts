import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  walletOutline,
  createOutline,
  searchOutline,
  trashOutline
} from 'ionicons/icons';

import { OperadorCuotaService, OperadorCuota } from 'src/app/services/operador-cuota.service';

@Component({
  selector: 'app-cuotas-operador',
  standalone: true,
  templateUrl: './cuotas-operador.page.html',
  styleUrls: ['./cuotas-operador.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon
  ]
})
export class CuotasOperadorPage implements OnInit {
  operadorId: number | null = null;
  operadorNombre = '';
  numeroEmpleado = '';

  periodoActual = '';

  cuotas: OperadorCuota[] = [];
  cuotasFiltradas: OperadorCuota[] = [];

  searchTerm = '';
  saving = false;
  deleting = false;

  resumen = {
    cuota_objetivo: 0,
    cuota_realizada: 0,
    cuota_restante: 0,
    estado_cuota: 'SIN_CONFIGURAR'
  };

  form = {
    periodo: '',
    cuota_objetivo: 0,
    cuota_realizada: 0
  };

  editingId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private operadorCuotaService: OperadorCuotaService
  ) {
    addIcons({
      arrowBackOutline,
      walletOutline,
      createOutline,
      searchOutline,
      trashOutline
    });
  }

  ngOnInit(): void {
    this.operadorId = Number(this.route.snapshot.paramMap.get('id'));
    this.periodoActual = this.getCurrentPeriod();
    this.form.periodo = this.periodoActual;

    if (this.operadorId) {
      this.loadCuotas();
    }
  }

  loadCuotas(): void {
    if (!this.operadorId) return;

    this.operadorCuotaService.getCuotasPorOperador(this.operadorId).subscribe({
      next: (response: any) => {
        const operador = response?.operador ?? null;
        const resumen = response?.resumen ?? null;
        const cuotas = Array.isArray(response?.cuotas) ? response.cuotas : [];

        this.operadorNombre = operador?.nombre_completo || '';
        this.numeroEmpleado = operador?.numero_empleado || '';

        this.cuotas = cuotas.map((c: any) => ({
          id_op_cuota: c.id_op_cuota,
          fk_operador: c.fk_operador,
          periodo: c.periodo,
          cuota_objetivo: Number(c.cuota_objetivo ?? 0),
          cuota_realizada: Number(c.cuota_realizada ?? 0),
          cuota_restante: Number(c.cuota_restante ?? 0),
          estado_cuota: c.estado_cuota ?? 'SIN_CONFIGURAR'
        }));

        this.cuotasFiltradas = [...this.cuotas];

        if (resumen) {
          this.resumen = {
            cuota_objetivo: Number(resumen.cuota_objetivo ?? 0),
            cuota_realizada: Number(resumen.cuota_realizada ?? 0),
            cuota_restante: Number(resumen.cuota_restante ?? 0),
            estado_cuota: resumen.estado_cuota ?? 'SIN_CONFIGURAR'
          };
        } else {
          this.resumen = {
            cuota_objetivo: 0,
            cuota_realizada: 0,
            cuota_restante: 0,
            estado_cuota: 'SIN_CONFIGURAR'
          };
        }

        this.applyFilter();
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.msg || err?.error?.message || 'Error al cargar cuotas del operador');
      }
    });
  }

  saveCuota(): void {
    if (!this.operadorId) {
      alert('Operador inválido.');
      return;
    }

    const periodo = String(this.form.periodo || '').trim();
    const cuotaObjetivo = Number(this.form.cuota_objetivo || 0);
    const cuotaRealizada = Number(this.form.cuota_realizada || 0);

    if (!periodo || periodo.length !== 6) {
      alert('El periodo debe tener formato YYYYMM.');
      return;
    }

    if (cuotaObjetivo < 0 || cuotaRealizada < 0) {
      alert('Las cuotas no pueden ser negativas.');
      return;
    }

    if (cuotaRealizada > cuotaObjetivo) {
      alert('La cuota realizada no puede ser mayor que la cuota objetivo.');
      return;
    }

    const payload: OperadorCuota = {
      fk_operador: this.operadorId,
      periodo,
      cuota_objetivo: cuotaObjetivo,
      cuota_realizada: cuotaRealizada
    };

    this.saving = true;

    if (this.editingId) {
      this.operadorCuotaService.updateCuota(this.editingId, {
        periodo: payload.periodo,
        cuota_objetivo: payload.cuota_objetivo,
        cuota_realizada: payload.cuota_realizada
      }).subscribe({
        next: (response: any) => {
          this.saving = false;
          alert(response?.msg || 'Cuota actualizada correctamente.');
          this.resetForm();
          this.loadCuotas();
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          alert(
            err?.error?.msg ||
            err?.error?.errors?.periodo?.[0] ||
            err?.error?.message ||
            'Error al actualizar cuota'
          );
        }
      });
      return;
    }

    this.operadorCuotaService.createCuota(payload).subscribe({
      next: (response: any) => {
        this.saving = false;
        alert(response?.msg || 'Cuota creada correctamente.');
        this.resetForm();
        this.loadCuotas();
      },
      error: (err) => {
        this.saving = false;
        console.error(err);
        alert(
          err?.error?.msg ||
          err?.error?.errors?.periodo?.[0] ||
          err?.error?.message ||
          'Error al guardar cuota'
        );
      }
    });
  }

  editCuota(c: OperadorCuota): void {
    this.editingId = c.id_op_cuota ?? null;
    this.form = {
      periodo: c.periodo,
      cuota_objetivo: Number(c.cuota_objetivo ?? 0),
      cuota_realizada: Number(c.cuota_realizada ?? 0)
    };
  }

  deleteCuota(c: OperadorCuota): void {
    if (!c.id_op_cuota) return;

    const confirmado = confirm(`¿Eliminar la cuota del periodo ${c.periodo}?`);
    if (!confirmado) return;

    this.deleting = true;

    this.operadorCuotaService.deleteCuota(c.id_op_cuota).subscribe({
      next: (response: any) => {
        this.deleting = false;
        alert(response?.msg || 'Cuota eliminada correctamente.');
        if (this.editingId === c.id_op_cuota) {
          this.resetForm();
        }
        this.loadCuotas();
      },
      error: (err) => {
        this.deleting = false;
        console.error(err);
        alert(err?.error?.msg || err?.error?.message || 'Error al eliminar cuota');
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = {
      periodo: this.periodoActual,
      cuota_objetivo: 0,
      cuota_realizada: 0
    };
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.cuotasFiltradas = this.cuotas.filter((c) => {
      const periodo = String(c.periodo || '').toLowerCase();
      const estado = String(c.estado_cuota || '').toLowerCase();

      return !term || periodo.includes(term) || estado.includes(term);
    });
  }

  getEstadoLabel(c: OperadorCuota): string {
    return c.estado_cuota || 'SIN_CONFIGURAR';
  }

  getEstadoClass(c: OperadorCuota): string {
    switch ((c.estado_cuota || '').toUpperCase()) {
      case 'ACTIVA':
        return 'ok';
      case 'BAJA':
        return 'warn';
      case 'AGOTADA':
      case 'SIN_CONFIGURAR':
        return 'off';
      default:
        return 'off';
    }
  }

  getCurrentPeriod(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}${m}`;
  }

  goBack(): void {
    this.location.back();
  }
}