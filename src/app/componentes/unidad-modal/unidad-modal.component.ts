import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UnidadService } from 'src/app/services/unidad.service';
import { Unidad } from 'src/models/unidad.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  busOutline,
  closeOutline,
  pricetagOutline,
  checkmarkCircleOutline,
  locationOutline,
  chevronDownOutline,
  informationCircleOutline,
  addCircleOutline,
  saveOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-unidad-modal',
  templateUrl: './unidad-modal.component.html',
  styleUrls: ['./unidad-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, FormsModule],
})
export class UnidadModalComponent implements OnInit {
  @Input() unidad: any = null;
  @Input() isCreate: boolean = true;

  form: Unidad = {
    id_unidad: 0,
    numero_economico: '',
    estado: 'DISPONIBLE',
    fk_licencia_requerida: 1,
    fk_zona_actual: 1
  };

  licencias: any[] = [];
  zonas: any[] = [];

  constructor(
    private modalController: ModalController,
    private unidadService: UnidadService
  ) {
    addIcons({
      busOutline,
      closeOutline,
      pricetagOutline,
      checkmarkCircleOutline,
      locationOutline,
      chevronDownOutline,
      informationCircleOutline,
      addCircleOutline,
      saveOutline,
    });
  }

  ngOnInit() {
    this.loadCatalogos();

    if (this.unidad && !this.isCreate) {
      this.form = { ...this.unidad };
    }
  }

  loadCatalogos() {
    this.unidadService.getLicencias().subscribe((res) => {
      this.licencias = res.licencias || [];
    });

    if (this.isCreate) {
      this.unidadService.getZonas().subscribe((res) => {
        this.zonas = res || [];
      });
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  save() {
    if (!this.form.numero_economico) {
      alert('Por favor, ingrese el número económico.');
      return;
    }

    if (this.isCreate) {
      this.unidadService.createUnidad(this.form).subscribe(
        () => this.modalController.dismiss({ created: true }),
        () => alert('Error al guardar la unidad.')
      );
    } else {
      // En edición solo enviamos el número económico — el estado no se toca
      const payload: Unidad = { ...this.unidad, numero_economico: this.form.numero_economico };
      this.unidadService.updateUnidad(this.unidad.id_unidad, payload).subscribe(
        () => this.modalController.dismiss({ updated: true }),
        () => alert('Error al actualizar la unidad.')
      );
    }
  }
}