import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { ViajeService } from 'src/app/services/viaje.service';
import { Viaje } from 'src/models/viaje.model';
import { Router } from '@angular/router';          // ← AGREGAR
import {
  chevronDown,
  informationCircleOutline,
  searchCircleOutline,
  closeOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { RouterLink } from '@angular/router';

type ViajeApi = Viaje & {
  unidad?: { numero_economico?: string | number; numeroEconomico?: string | number };
  operador?: { nombres?: string; apellidos?: string };
  ruta?: { nombre_ruta?: string };
  certificaciones?: Array<{ id_certificacion?: number; nombre_certificacion?: string }>;
  licencia?: { nombre_licencia?: string; nombre?: string; tipo?: string };
  configuracion_unidad?: string;
};

@Component({
  selector: 'app-viajes',
  templateUrl: './viajes.page.html',
  styleUrls: ['./viajes.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterLink],
})
export class ViajesPage implements OnInit {
  viajes: Viaje[]          = [];
  viajesFiltrados: Viaje[] = [];

  // ── Cancelados bajo demanda ───────────────────────────────────────────────
  viajesCancelados: any[]    = [];
  mostrandoCancelados        = false;
  cargandoCancelados         = false;
  canceladosCargados         = false;   // evita re-fetches innecesarios

  // ── Filtros ──────────────────────────────────────────────────────────────
  searchTerm     = '';
  selectedRuta   = '';
  selectedEstado = '';

  rutasUnicas:   string[] = [];
  estadosUnicos: string[] = [];

  constructor(
    private viajeService: ViajeService,
    private router: Router,              // ← AGREGAR
  ) {
    addIcons({
      informationCircleOutline,
      searchCircleOutline,
      chevronDown,
      closeOutline,
      closeCircleOutline,
      chevronDownOutline: chevronDown,
      searchDownOutline:  searchCircleOutline,
    });
  }

  ngOnInit() { this.getViajes(); }
  ionViewWillEnter() { this.getViajes(); }

 getViajes() {
  this.viajeService.getViajes().subscribe((respuesta: any) => {
    const lista = Array.isArray(respuesta?.viajes) ? respuesta.viajes : [];

    // El backend ya devuelve todo aplanado — no hace falta map complejo
    this.viajes = lista.filter((v: any) => v.estado !== 'CANCELADO');

    this.applyFilters();

    this.rutasUnicas = [
      ...new Set(this.viajes.map((v: any) => (v.nombre_ruta || '').trim()).filter(Boolean)),
    ].sort();

    this.estadosUnicos = [
      ...new Set(this.viajes.map((v: any) => (v.estado || '').trim()).filter(Boolean)),
    ].sort();

    if (this.mostrandoCancelados) {
      this.canceladosCargados = false;
      this.cargarCancelados();
    }
  });
}
  // ── Cancelados bajo demanda ───────────────────────────────────────────────
  toggleCancelados() {
    if (this.mostrandoCancelados) {
      this.mostrandoCancelados = false;
      return;
    }
    this.cargarCancelados();
  }
private cargarCancelados() {
  if (this.canceladosCargados) {
    this.mostrandoCancelados = true;
    return;
  }
  this.cargandoCancelados = true;
  this.viajeService.getViajesCancelados().subscribe({
    next: (res: any) => {
      this.viajesCancelados   = Array.isArray(res?.viajes) ? res.viajes : [];
      this.canceladosCargados  = true;
      this.mostrandoCancelados = true;
      this.cargandoCancelados  = false;
    },
    error: () => { this.cargandoCancelados = false; },
  });
}
  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.viajesFiltrados = this.viajes.filter((viaje: any) => {
      const matchesSearch =
        !term ||
        String(viaje.numero_viaje         || '').toLowerCase().includes(term) ||
        String(viaje.nombre_ruta          || '').toLowerCase().includes(term) ||
        String(viaje.operador_nombre      || '').toLowerCase().includes(term) ||
        String(viaje.numero_economico     || '').toLowerCase().includes(term) ||
        String(viaje.configuracion_unidad || '').toLowerCase().includes(term) ||
        String(viaje.estado               || '').toLowerCase().includes(term);
      const matchesRuta   = !this.selectedRuta   || viaje.nombre_ruta === this.selectedRuta;
      const matchesEstado = !this.selectedEstado || viaje.estado      === this.selectedEstado;
      return matchesSearch && matchesRuta && matchesEstado;
    });
  }

  resetFilters(): void {
    this.searchTerm     = '';
    this.selectedRuta   = '';
    this.selectedEstado = '';
    this.applyFilters();
  }

  // ── Navegación operador / unidad ──────────────────────────────────────────
  irAOperador(idOperador: number | undefined, event: Event) {
    event.stopPropagation();
    if (!idOperador) return;
    this.router.navigate(['/operadores', idOperador]);
  }

  irAUnidad(idUnidad: number | undefined, event: Event) {
    event.stopPropagation();
    if (!idUnidad) return;
    this.router.navigate(['/unidades', idUnidad]);
  }

  trackByNumeroViaje = (index: number, item: Viaje) => item.numero_viaje || index;

  getEstadoClass(estado: string | undefined): string {
    switch ((estado || '').toUpperCase()) {
      case 'ASIGNADO':
      case 'TERMINADO':
      case 'ACTIVO':    return 'ok';
      case 'PENDIENTE':
      case 'EN_CURSO':  return 'pending';
      case 'CANCELADO': return 'off';
      default:          return 'warn';
    }
  }


  
}