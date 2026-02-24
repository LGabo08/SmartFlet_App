import { Component, OnInit } from '@angular/core';
import { ViajeService } from 'src/app/services/viaje.service';
import { Viaje } from 'src/models/viaje.model'; // Importamos el modelo de Viaje

type EstadoViaje = 'En curso' | 'Finalizado';

@Component({
  selector: 'app-viajes',
  templateUrl: './viajes.page.html',
  styleUrls: ['./viajes.page.scss'],
})
export class ViajesPage implements OnInit {
  viajes: Viaje[] = [];  // Definimos el arreglo de viajes con el tipo 'Viaje'
  filtroTexto = '';
  filtroEstado: '' | EstadoViaje = '';
  filtroCliente = '';
  filtroNoViaje = '';
  tarifaMin: number | null = null;
  tarifaMax: number | null = null;

  constructor(private viajeService: ViajeService) {}

  ngOnInit() {
    // Obtener los viajes de la API cuando se carga la página
    this.getViajes();
  }

  // Método para obtener los viajes
  getViajes() {
    this.viajeService.getViajes().subscribe((data: Viaje[]) => {
      this.viajes = data;  // Guardamos los datos obtenidos en el arreglo de viajes
    });
  }

  // Filtro de los viajes
  get viajesFiltrados(): Viaje[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    const noViaje = this.filtroNoViaje.trim().toLowerCase();

    return this.viajes.filter(v => {
      const matchTexto =
        !texto ||
        (`${v.numero_viaje} ${v.ruta} ${v.origen} ${v.destino} ${v.producto} ${v.unidad} ${v.operador}`
          .toLowerCase()
          .includes(texto));

      const matchEstado =
        !this.filtroEstado || v.estado === this.filtroEstado;

      const matchCliente =
        !this.filtroCliente || v.cliente === this.filtroCliente;

      const matchNoViaje =
        !noViaje || v.numero_viaje.toLowerCase().includes(noViaje);

      const t = v.pago_operador ?? 0;

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
  trackByNumeroViaje = (_: number, item: Viaje) => item.numero_viaje || _;

  // ======================
  // ACCIÓN +
  // ======================
  agregarViaje(): void {
    const nuevo: Viaje = {
      id_viaje: 0,  // Inicializamos el ID como 0
      numero_viaje: this.generarFolio(),
      fk_ruta: 0,  // Inicializamos con valores predeterminados
      fk_licencia_requerida: 0,
      fk_certificacion_requerida: 0,
      fk_operador: 0,
      fk_unidad: 0,
      fecha_salida: '',
      fecha_llegada: '',
      estado: 'PENDIENTE',
      pago_operador: 0,
    };

    this.viajes.unshift(nuevo);
  }

  private generarFolio(): string {
    const nums = this.viajes
      .map(v => parseInt((v.numero_viaje || '').replace('VJ-', ''), 10))
      .filter(n => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `VJ-${String(next).padStart(3, '0')}`;
  }
}