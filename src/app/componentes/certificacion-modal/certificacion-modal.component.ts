import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';  // Para el control del modal
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CertificacionService } from 'src/app/services/certificacion.service';  // Asegúrate de importar el servicio

@Component({
  selector: 'app-certificacion-modal',
  templateUrl: './certificacion-modal.component.html',  // Usamos el HTML del modal de Bootstrap
  styleUrls: ['./certificacion-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class CertificacionModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;  // Estado de la modal
  @Input() selectedCertification: any = null;  // Certificación seleccionada
  @Input() clientes: any[] = [];  // Lista de clientes
  @Output() closeModal = new EventEmitter<void>();  // Evento para cerrar el modal
  @Output() saveCertification = new EventEmitter<any>();  // Evento para guardar la certificación

  certificacionesForm: FormGroup;

  constructor(private fb: FormBuilder, 
              private modalController: ModalController, 
              private certificacionService: CertificacionService) { 
    this.certificacionesForm = this.fb.group({
      nombre: ['', Validators.required],
      cliente: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  ngOnChanges() {
    // Verifica que se esté recibiendo correctamente la certificación seleccionada
    console.log('Selected Certification:', this.selectedCertification);
    
    if (this.selectedCertification) {
      this.certificacionesForm.patchValue({
        nombre: this.selectedCertification.nombre_certificacion,
        descripcion: this.selectedCertification.descripcion,
        cliente: this.selectedCertification.fk_cliente, // Asignamos el ID del cliente
      });
    }
  }

  onClose() {
    this.closeModal.emit(); // Emitimos el evento para cerrar el modal
    this.modalController.dismiss(); // Cerramos el modal
  }

  onSave() {
    if (this.certificacionesForm.valid) {
      const updatedData = this.certificacionesForm.value;
      const certificacion = {
        ...this.selectedCertification!,
        ...updatedData,
      };

      console.log('Datos para guardar:', certificacion);  // Verifica los datos en consola

      // Aquí es donde debes llamar al servicio para actualizar la certificación
      this.certificacionService.updateCertificacion(certificacion.id_certificacion, certificacion)
        .subscribe(
          (response) => {
            console.log('Certificación actualizada:', response);
            this.saveCertification.emit(response);  // Emitimos la certificación actualizada
            this.onClose();  // Cerramos el modal
          },
          (error) => {
            console.error('Error al actualizar la certificación:', error);
          }
        );
    }
  }
}