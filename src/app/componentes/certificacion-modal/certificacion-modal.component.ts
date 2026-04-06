import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { CertificacionService } from 'src/app/services/certificacion.service';
import { addIcons } from 'ionicons';
import {
  ribbonOutline,
  closeOutline,
  documentTextOutline,
  readerOutline,
  businessOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
} from 'ionicons/icons';

import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-certificacion-modal',
  templateUrl: './certificacion-modal.component.html',
  styleUrls: ['./certificacion-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonIcon,
  ],
})
export class CertificacionModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() selectedCertification: any = null;
  @Input() clientes: any[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveCertification = new EventEmitter<any>();

  certificacionesForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private certificacionService: CertificacionService
  ) {
    addIcons({
      ribbonOutline,
      closeOutline,
      documentTextOutline,
      readerOutline,
      businessOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
    });

    this.certificacionesForm = this.fb.group({
      nombre:      ['', Validators.required],
      cliente:     ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.selectedCertification) {
      this.certificacionesForm.patchValue({
        nombre:      this.selectedCertification.nombre_certificacion,
        descripcion: this.selectedCertification.descripcion,
        cliente:     String(this.selectedCertification.fk_cliente),
      });
    }
  }

  onClose() {
    this.closeModal.emit();
    this.modalController.dismiss();
  }

  onSave() {
    if (this.certificacionesForm.invalid) {
      this.certificacionesForm.markAllAsTouched();
      return;
    }

    const updatedData = this.certificacionesForm.value;
    const certificacion = {
      ...this.selectedCertification,
      nombre_certificacion: updatedData.nombre,
      descripcion:          updatedData.descripcion,
      fk_cliente:           updatedData.cliente,
      cliente:              updatedData.cliente,
    };

    this.certificacionService
      .updateCertificacion(certificacion.id_certificacion, certificacion)
      .subscribe({
        next: (response) => {
          this.saveCertification.emit(response);
          this.modalController.dismiss(response);
        },
        error: (error) => {
          console.error('Error al actualizar la certificación:', error);
        },
      });
  }
}