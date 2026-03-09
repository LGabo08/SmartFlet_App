import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-cambio-estado-modal',
  standalone: true,
  templateUrl: './cambio-estado-modal.component.html',
  styleUrls: ['./cambio-estado-modal.component.scss'],
  imports: [FormsModule, IonicModule],
})
export class CambioEstadoModalComponent {
  @Input() unidad: any;

  motivo: string = '';
  nuevoEstado: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.nuevoEstado = this.unidad?.estado || '';
  }

  dismiss() {
    this.modalController.dismiss();
  }

  save() {
    const estadoActual = this.unidad?.estado || '';

    if (!this.nuevoEstado) {
      alert('Por favor, selecciona el nuevo estado');
      return;
    }

    if (!this.motivo.trim()) {
      alert('Por favor, ingresa el motivo');
      return;
    }

    if (this.nuevoEstado === estadoActual) {
      alert('Selecciona un estado diferente al actual');
      return;
    }

    this.modalController.dismiss({
      estado_anterior: estadoActual,
      estado_nuevo: this.nuevoEstado,
      motivo: this.motivo.trim(),
    });
  }
}