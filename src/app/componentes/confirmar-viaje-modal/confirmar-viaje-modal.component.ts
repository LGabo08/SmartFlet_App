import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

export interface ConfirmarViajeData {
  numero_viaje: string;
  rutaNombre: string;
  configuracion_unidad: string;
  licenciaNombre: string;
  producto: string;
  clienteNombre: string;
  certificacionesNombres: string[];
  pago_operador: number;
}

@Component({
  selector: 'app-confirmar-viaje-modal',
  standalone: true,
  templateUrl: './confirmar-viaje-modal.component.html',
  styleUrls: ['./confirmar-viaje-modal.component.scss'],
  imports: [CommonModule, IonIcon],
})
export class ConfirmarViajeModalComponent {
  /** Datos del resumen a mostrar */
  @Input() data!: ConfirmarViajeData;

  /** true mientras el padre está guardando */
  @Input() saving = false;

  /** Emite cuando el usuario confirma */
  @Output() confirmed = new EventEmitter<void>();

  /** Emite cuando el usuario cancela / cierra */
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    if (!this.saving) {
      this.confirmed.emit();
    }
  }

  onCancel() {
    if (!this.saving) {
      this.cancelled.emit();
    }
  }
}