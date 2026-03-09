import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';
import { ViajeService } from 'src/app/services/viaje.service';

import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Ruta } from 'src/models/ruta.model';
import { Licencia } from 'src/models/licencia.model';
import { Certificacion } from 'src/models/certificacion.model';
import { Cliente } from 'src/models/cliente.model';

@Component({
  selector: 'app-agregar-viaje',
  standalone: true,
  templateUrl: './agregar-viaje.page.html',
  styleUrls: ['./agregar-viaje.page.scss'],
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
})
export class AgregarViajePage implements OnInit {
  viajeForm: FormGroup;
  rutas: Ruta[] = [];
  licencias: Licencia[] = [];
  licenciasDisponibles: Licencia[] = [];
  certificaciones: Certificacion[] = [];
  clientes: Cliente[] = [];  // Lista de clientes
  configuracionesUnidad: string[] = ['Configuración 1', 'Configuración 2', 'Configuración 3']; // Configuraciones disponibles
  saving = false;

  constructor(
    private fb: FormBuilder,
    private viajeService: ViajeService,
    private datosViajeService: DatosViajeService
  ) {
    this.viajeForm = this.fb.group({
      numero_viaje: ['', Validators.required],
      fk_ruta: ['', Validators.required],
      configuracion_unidad: ['', Validators.required],
      fk_licencia_requerida: ['', Validators.required],
      producto: ['', Validators.required],
      cliente: ['', Validators.required], // Campo cliente
      certificaciones: [[], [Validators.required]],
      pago_operador: ['', [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    this.datosViajeService.getRutas().subscribe((data: any) => {
      this.rutas = Array.isArray(data) ? data : [];
    });

    this.datosViajeService.getLicencias().subscribe((data: any) => {
      this.licencias = Array.isArray(data) ? data : [];
      this.licenciasDisponibles = this.licencias; // Inicializamos licencias disponibles
    });

    this.datosViajeService.getCertificaciones().subscribe((data: any) => {
      this.certificaciones = Array.isArray(data) ? data : [];
    });

    // Obtener clientes
    this.datosViajeService.getClientes().subscribe((data: any) => {
      this.clientes = Array.isArray(data) ? data : [];
    });
  }

  // Método para actualizar las licencias disponibles según la configuración de unidad seleccionada
  onConfiguracionUnidadChange(configId: string) {
    if (configId === 'Configuración 1' || configId === 'Configuración 2') {
      this.licenciasDisponibles = this.licencias.filter(licencia => licencia.descripcion_licencia === 'Licencia demo Tipo A');
    } else if (configId === 'Configuración 3') {
      this.licenciasDisponibles = this.licencias.filter(licencia => licencia.descripcion_licencia === 'Licencia demo Tipo B');
    } else {
      this.licenciasDisponibles = [];
    }

    // Reseteamos el campo de licencia seleccionada
    this.viajeForm.patchValue({
      fk_licencia_requerida: '',
    });
  }

  // Método para cargar las certificaciones basadas en el cliente seleccionado
onClienteChange(event: Event) {
  const clienteId = (event.target as HTMLSelectElement).value; // Usamos 'HTMLSelectElement' para acceder al 'value'
  if (!clienteId) return;

  // Filtrar certificaciones por cliente
  this.datosViajeService.getCertificacionesPorCliente(clienteId).subscribe((data: any) => {
    this.certificaciones = Array.isArray(data) ? data : [];
  });

  // Reseteamos el campo de certificaciones seleccionadas
  this.viajeForm.patchValue({
    certificaciones: [],
  });
}

  async onSubmit() {
    if (this.viajeForm.invalid) return;

    const raw = this.viajeForm.value;
    console.log('Datos enviados:', raw);

    const viajeData: any = {
      numero_viaje: String(raw.numero_viaje ?? '').trim(),
      fk_ruta: parseInt(raw.fk_ruta, 10),
      configuracion_unidad: raw.configuracion_unidad,
      fk_licencia_requerida: raw.fk_licencia_requerida,
      producto: raw.producto.trim(),
      cliente: raw.cliente.trim(),
      estado: 'PENDIENTE',
      certificaciones: [],
      pago_operador: parseFloat(raw.pago_operador),
    };

    const selected = raw.certificaciones;
    if (Array.isArray(selected)) {
      viajeData.certificaciones = selected
        .map((x: any) => parseInt(x, 10))
        .filter((n: any) => !isNaN(n));
    } else if (selected != null && selected !== '') {
      const n = parseInt(selected, 10);
      viajeData.certificaciones = isNaN(n) ? [] : [n];
    }

    this.saving = true;

    try {
      const res = await this.viajeService.createViaje(viajeData).toPromise();
      if (res?.ok) {
        alert('Viaje agregado correctamente');
        this.viajeForm.reset({
          numero_viaje: '',
          fk_ruta: '',
          configuracion_unidad: '',
          fk_licencia_requerida: '',
          producto: '',
          cliente: '',
          certificaciones: [],
          pago_operador: '',
        });
      } else {
        alert('Error al agregar el viaje');
      }
    } catch (error) {
      alert('Error al agregar el viaje');
      console.error(error);
    } finally {
      this.saving = false;
    }
  }
}