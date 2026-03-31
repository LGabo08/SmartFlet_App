import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UnidadService } from 'src/app/services/unidad.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  closeOutline,
  calendarOutline,
  chatbubbleOutline,
  arrowForwardOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-historial-modal-component',
  templateUrl: './historial-modal-component.component.html',
  styleUrls: ['./historial-modal-component.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
})
export class HistorialModalComponent implements OnInit {
  @Input() unidadId!: number;
  historial: any[] = [];

  constructor(
    private modalController: ModalController,
    private unidadService: UnidadService
  ) {
    addIcons({
      timeOutline,
      closeOutline,
      calendarOutline,
      chatbubbleOutline,
      arrowForwardOutline,
    });
  }

  ngOnInit() {
    this.getHistorial();
  }

  getHistorial() {
    this.unidadService.getHistorialEstado(this.unidadId).subscribe({
      next: (response: any) => {
        if (response.ok) {
          this.historial = response.historial;
        }
      },
      error: (err) => console.error('Error al cargar historial:', err),
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}