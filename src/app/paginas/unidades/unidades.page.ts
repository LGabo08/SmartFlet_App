import { Component, OnInit } from '@angular/core';
import { UnidadService } from 'src/app/services/unidad.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CambioEstadoModalComponent } from 'src/app/componentes/cambio-estado-modal/cambio-estado-modal.component';

@Component({
  selector: 'app-unidades',
  standalone: true,
  templateUrl: './unidades.page.html',
  styleUrls: ['./unidades.page.scss'],
  imports: [CommonModule, IonicModule, FormsModule],
})
export class UnidadesPage implements OnInit {
  public unidades: any[] = [];

  constructor(
    private unidadService: UnidadService,
    public router: Router,
    private modalController: ModalController
  ) {}

  ngOnInit(): void {
    this.getUnidades();
  }

  getUnidades() {
    this.unidadService.getUnidades().subscribe({
      next: (response: any) => {
        if (response.ok) {
          this.unidades = response.unidades;
        } else {
          console.log('No se encontraron unidades.');
        }
      },
      error: (err) => {
        console.error('Error al cargar unidades:', err);
        alert('Error al cargar unidades');
      }
    });
  }

  async openModal(unidad: any) {
    const modal = await this.modalController.create({
      component: CambioEstadoModalComponent,
      componentProps: {
        unidad: unidad
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (!data) return;

    const payload = {
      estado_nuevo: data.estado_nuevo,
      motivo: data.motivo
    };

    this.unidadService.cambiarEstado(unidad.id_unidad, payload).subscribe({
      next: (response: any) => {
        if (response?.ok) {
          alert(response.msg || 'Estado actualizado correctamente');
          this.getUnidades();
        } else {
          alert(response?.msg || 'No se pudo actualizar el estado');
        }
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        alert(
          err?.error?.msg ||
          err?.error?.message ||
          'Error al cambiar el estado de la unidad'
        );
      }
    });
  }

  eliminarUnidad(id: string) {
    if (confirm('¿Seguro que deseas eliminar esta unidad?')) {
      this.unidadService.deleteUnidad(id).subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.getUnidades();
          }
        },
        error: (err) => {
          console.error('Error al eliminar unidad:', err);
          alert('Error al eliminar unidad');
        }
      });
    }
  }

  editarUnidad(id: string) {
    this.router.navigate([`/editar-unidad/${id}`]);
  }

  verHistorial(unidad: any) {
    // Aquí más adelante puedes abrir otra página o modal
    // para consultar el historial de la tabla reporte
    console.log('Ver historial de unidad:', unidad);
    alert(`Aquí irá el historial de la unidad ${unidad.numero_economico}`);
  }
}