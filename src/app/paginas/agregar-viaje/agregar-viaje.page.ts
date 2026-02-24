import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatosViajeService } from 'src/app/services/datos-viaje.service'; // Asegúrate de que este servicio exista
import { ViajeService } from 'src/app/services/viaje.service'; // Asegúrate de que este servicio exista

import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonLabel, IonItem, IonInput, IonSelect, IonSelectOption, IonDatetime } from '@ionic/angular';
import { Ruta } from 'src/models/ruta.model';
import { Licencia } from 'src/models/licencia.model';
import { Certificacion } from 'src/models/certificacion.model';
@Component({
  selector: 'app-agregar-viaje',
  standalone: true,
  templateUrl: './agregar-viaje.page.html',
  styleUrls: ['./agregar-viaje.page.scss'],
  imports: [CommonModule, ReactiveFormsModule, IonicModule],  // Importa IonicModule
})
export class AgregarViajePage implements OnInit {
  viajeForm: FormGroup;
  rutas: Ruta[] = [];         // Ahora con el tipo 'Ruta'
  licencias: Licencia[] = []; // Ahora con el tipo 'Licencia'
  certificaciones: Certificacion[] = []; // Ahora con el tipo 'Certificacion'

  // Propiedad saving para controlar el estado de guardado
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private viajeService: ViajeService,
    private datosViajeService: DatosViajeService
  ) {
    this.viajeForm = this.fb.group({
      numero_viaje: ['', Validators.required],
      fk_ruta: ['', Validators.required],
      fk_licencia_requerida: ['', Validators.required],
      fk_certificacion_requerida: ['', Validators.required],
      // fecha_salida: ['', Validators.required],
      // fecha_llegada: ['', Validators.required],
      pago_operador: ['', [Validators.required, Validators.min(0)]],
      estado: ['PENDIENTE', Validators.required],
    });
  }

  ngOnInit() {
    // Llamar al servicio para obtener las rutas, licencias y certificaciones
    this.datosViajeService.getRutas().subscribe((data) => (this.rutas = data));
    this.datosViajeService.getLicencias().subscribe((data) => (this.licencias = data));
    this.datosViajeService.getCertificaciones().subscribe((data) => (this.certificaciones = data));
  }

  // Función de enviar el formulario
 async onSubmit() {
  if (this.viajeForm.invalid) return;

  const viajeData = this.viajeForm.value;

  // Eliminar las fechas si no se necesitan
  if (!viajeData.fecha_salida) {
    delete viajeData.fecha_salida;
  }
  if (!viajeData.fecha_llegada) {
    delete viajeData.fecha_llegada;
  }

  this.saving = true;

  try {
    const res = await this.viajeService.createViaje(viajeData).toPromise();
    if (res?.ok) {
      alert('Viaje agregado correctamente');
    } else {
      alert('Error al agregar el viaje');
    }
  } catch (error) {
    alert('Error al agregar el viaje');
  } finally {
    this.saving = false;
  }
}
}