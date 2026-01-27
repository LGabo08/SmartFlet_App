import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';

type EstadoViaje = 'En curso' | 'Finalizado';

export interface Viaje {
  numeroViaje: string;
  cita: string;
  tarifa: number | null;
  unidad: string;
  operador: string;
  producto: string;
  cliente: string;
  origen: string;
  destino: string;
  estado: EstadoViaje;
}

@Component({
  selector: 'app-viajes',
  templateUrl: './viajes.page.html',
  styleUrls: ['./viajes.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, RouterLink]
})
export class ViajesPage implements OnInit {

  constructor() {}
  ngOnInit() {}

  // ======================
  // DATA
  // ======================
  viajes: Viaje[] = [
    {
      numeroViaje: 'VJ-001',
      cita: '08:30',
      tarifa: 15000,
      unidad: 'TX-34',
      operador: 'Juan Pérez',
      producto: 'Acero',
      cliente: 'CEMEX',
      origen: 'Veracruz',
      destino: 'Puebla',
      estado: 'En curso',
    },
    {
      numeroViaje: 'VJ-002',
      cita: '10:00',
      tarifa: 22000,
      unidad: 'TX-18',
      operador: 'Carlos Ruiz',
      producto: 'Cemento',
      cliente: 'Holcim',
      origen: 'Orizaba',
      destino: 'CDMX',
      estado: 'Finalizado',
    },
    {
      numeroViaje: 'VJ-002',
      cita: '10:00',
      tarifa: 22000,
      unidad: 'TX-18',
      operador: 'Carlos Ruiz',
      producto: 'Cemento',
      cliente: 'Holcim',
      origen: 'Orizaba',
      destino: 'CDMX',
      estado: 'Finalizado',
    }
    ,
    {
      numeroViaje: 'VJ-002',
      cita: '10:00',
      tarifa: 55000,
      unidad: 'TX-18',
      operador: 'Carlos Ruiz',
      producto: 'Cemento',
      cliente: 'Holcim',
      origen: 'Orizaba',
      destino: 'CDMX',
      estado: 'Finalizado',
    }
  ];

  filtroTexto = '';
  filtroEstado: '' | EstadoViaje = '';
  filtroCliente = '';
  filtroNoViaje = '';
  tarifaMin: number | null = null;
  tarifaMax: number | null = null;

  // Dropdown de clientes (sale del arreglo)
  get clientesDisponibles(): string[] {
    return Array.from(new Set(this.viajes.map(v => v.cliente))).sort();
  }

  // ======================
  // VISTA FILTRADA
  // ======================
  get viajesFiltrados(): Viaje[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    const noViaje = this.filtroNoViaje.trim().toLowerCase();

    return this.viajes.filter(v => {
      const matchTexto =
        !texto ||
        (`${v.numeroViaje} ${v.cliente} ${v.origen} ${v.destino} ${v.producto} ${v.unidad} ${v.operador}`
          .toLowerCase()
          .includes(texto));

      const matchEstado =
        !this.filtroEstado || v.estado === this.filtroEstado;

      const matchCliente =
        !this.filtroCliente || v.cliente === this.filtroCliente;

      const matchNoViaje =
        !noViaje || v.numeroViaje.toLowerCase().includes(noViaje);

      const t = v.tarifa ?? 0;

      const matchTarifaMin =
        this.tarifaMin === null || t >= this.tarifaMin;

      const matchTarifaMax =
        this.tarifaMax === null || t <= this.tarifaMax;

      return (
        matchTexto &&
        matchEstado &&
        matchCliente &&
        matchNoViaje &&
        matchTarifaMin &&
        matchTarifaMax
      );
    });
  }

  // Para que no se pierda el foco al filtrar
  trackByNumeroViaje = (_: number, item: Viaje) => item.numeroViaje || _;

  // ======================
  // ACCIÓN +
  // ======================
  agregarViaje(): void {
    const nuevo: Viaje = {
      numeroViaje: this.generarFolio(),
      cita: '',
      tarifa: null,
      unidad: '',
      operador: '',
      producto: '',
      cliente: '',
      origen: '',
      destino: '',
      estado: 'En curso',
    };

    this.viajes.unshift(nuevo);
  }

  private generarFolio(): string {
    const nums = this.viajes
      .map(v => parseInt((v.numeroViaje || '').replace('VJ-', ''), 10))
      .filter(n => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `VJ-${String(next).padStart(3, '0')}`;
  }
}
