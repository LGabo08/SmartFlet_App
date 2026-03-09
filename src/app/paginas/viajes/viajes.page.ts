import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ViajeService } from 'src/app/services/viaje.service';
import { Viaje } from 'src/models/viaje.model';

type ViajeApi = Viaje & {
  unidad?: { numero_economico?: string | number; numeroEconomico?: string | number };
  operador?: { nombres?: string; apellidos?: string };
  ruta?: { nombre_ruta?: string };
  certificaciones?: Array<{ id_certificacion?: number; nombre_certificacion?: string }>;
  licencia?: { nombre_licencia?: string; nombre?: string; tipo?: string };
};

@Component({
  selector: 'app-viajes',
  templateUrl: './viajes.page.html',
  styleUrls: ['./viajes.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class ViajesPage implements OnInit {
  viajes: Viaje[] = [];
  viajesFiltrados: Viaje[] = [];

  modalOpen: boolean = false;
  modalData: Viaje | null = null;

  searchTerm: string = '';
  selectedRuta: string = '';
  selectedEstado: string = '';

  rutasUnicas: string[] = [];
  estadosUnicos: string[] = [];

  constructor(private viajeService: ViajeService) {}

  ngOnInit() {
    this.getViajes();
  }

  getViajes() {
    this.viajeService.getViajes().subscribe((respuesta: any) => {
      const lista = Array.isArray(respuesta?.viajes) ? respuesta.viajes : [];

      this.viajes = lista.map((vRaw: any) => {
        const v = vRaw as ViajeApi;

        const numeroEconomico =
          v.unidad?.numero_economico ??
          v.unidad?.numeroEconomico ??
          (v.fk_unidad ? `UN-${v.fk_unidad}` : '');

        const operadorNombre = v.operador?.nombres ?? '';
        const operadorApellidos = v.operador?.apellidos ?? '';
        const operadorFull = [operadorNombre, operadorApellidos].filter(Boolean).join(' ');

        const nombreRuta = v.ruta?.nombre_ruta ?? '';

        const nombreLicencia =
          v.licencia?.nombre_licencia ??
          v.licencia?.nombre ??
          v.licencia?.tipo ??
          (v.fk_licencia_requerida ? String(v.fk_licencia_requerida) : '');

        const certsArr = Array.isArray(v.certificaciones) ? v.certificaciones : [];
        const certNames = certsArr
          .map(c => (c?.nombre_certificacion ?? '').trim())
          .filter(Boolean);

        const nombreCertificacion = certNames.length ? certNames.join(', ') : '';

        return {
          ...v,
          numero_economico: String(numeroEconomico ?? ''),
          operador_nombre: operadorFull,
          operador_apellidos: operadorApellidos,
          nombre_certificacion: nombreCertificacion,
          nombre_ruta: nombreRuta,
          nombre_licencia: nombreLicencia,
          pago_operador: v.pago_operador,
          estado: v.estado,
        } as Viaje;
      });

      this.viajesFiltrados = [...this.viajes];

      this.rutasUnicas = [
        ...new Set(
          this.viajes
            .map(v => (v.nombre_ruta || '').trim())
            .filter(Boolean)
        ),
      ].sort();

      this.estadosUnicos = [
        ...new Set(
          this.viajes
            .map(v => (v.estado || '').trim())
            .filter(Boolean)
        ),
      ].sort();
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.viajesFiltrados = this.viajes.filter((viaje: any) => {
      const numeroViaje = String(viaje.numero_viaje || '').toLowerCase();
      const ruta = String(viaje.nombre_ruta || '').toLowerCase();
      const operador = String(viaje.operador_nombre || '').toLowerCase();
      const unidad = String(viaje.numero_economico || '').toLowerCase();
      const estado = String(viaje.estado || '').toLowerCase();

      const matchesSearch =
        !term ||
        numeroViaje.includes(term) ||
        ruta.includes(term) ||
        operador.includes(term) ||
        unidad.includes(term) ||
        estado.includes(term);

      const matchesRuta =
        !this.selectedRuta || viaje.nombre_ruta === this.selectedRuta;

      const matchesEstado =
        !this.selectedEstado || viaje.estado === this.selectedEstado;

      return matchesSearch && matchesRuta && matchesEstado;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRuta = '';
    this.selectedEstado = '';
    this.viajesFiltrados = [...this.viajes];
  }

  trackByNumeroViaje = (index: number, item: Viaje) =>
    item.numero_viaje || index;

  showDetails(viaje: Viaje) {
    this.modalData = viaje;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.modalData = null;
  }

  getEstadoClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'ASIGNADO':
      case 'TERMINADO':
      case 'ACTIVO':
        return 'ok';

      case 'PENDIENTE':
      case 'EN_CURSO':
        return 'pending';

      case 'CANCELADO':
        return 'off';

      default:
        return 'warn';
    }
  }
}