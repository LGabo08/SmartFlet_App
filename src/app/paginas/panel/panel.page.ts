import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

type Id = string | number;

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './panel.page.html',
  styleUrls: ['./panel.page.scss'],
})
export class PanelPage {

  // ====== KPIs (demo) ======
  equilibrioPct = 78;            // 0 - 120 (ejemplo)
  dineroTotal = 42000;
  cuotaTotal = 60000;

  viajesTotal = 32;
  viajesFinalizados = 18;
  viajesEnRuta = 9;

  operadoresActivos = 12;
  operadoresDisponibles = 4;
  operadoresEnViaje = 8;

  // ====== Listas (demo) ======
  operadoresDisponiblesList = [
    { id: 1, nombre: 'Juan Pérez', unidad: 'T-01', ultimoViaje: 'Ayer' },
    { id: 2, nombre: 'Luis García', unidad: 'T-07', ultimoViaje: 'Hoy 09:10' },
  ];

  viajesAsignadosList = [
    { id: 101, origen: 'Veracruz', destino: 'Xalapa', operador: 'Juan Pérez', unidad: 'T-01', eta: '2h', estado: 'asignado', estadoLabel: 'Asignado' },
    { id: 102, origen: 'Puebla', destino: 'CDMX', operador: 'Ana Díaz', unidad: 'T-03', eta: '3h', estado: 'confirmado', estadoLabel: 'Confirmado' },
  ];

  viajesEnProcesoList = [
    { id: 201, origen: 'Orizaba', destino: 'Córdoba', operador: 'Carlos Ruiz', unidad: 'T-05', salida: 'Hoy 08:30' },
  ];

  rezagadosList = [
    { id: 10, nombre: 'Mario López', pctCuota: 35, viajes: 2, dinero: 12000 },
    { id: 11, nombre: 'Ernesto Cruz', pctCuota: 42, viajes: 7, dinero: 18000 },
    { id: 12, nombre: 'Sergio Méndez', pctCuota: 50, viajes: 3, dinero: 21000 },
  ];

  constructor(private router: Router) {}

  // ====== Derivados ======
  get equilibrioBarWidth(): number {
    // Limitar visualmente 0..120
    const v = Math.max(0, Math.min(120, this.equilibrioPct));
    return v;
  }

  get equilibrioEstado(): string {
    if (this.equilibrioPct < 70) return 'bad';
    if (this.equilibrioPct < 100) return 'ok';
    return 'good';
  }

  get equilibrioTexto(): string {
    if (this.equilibrioPct < 70) return 'Desequilibrio (alerta)';
    if (this.equilibrioPct < 100) return 'En balance';
    return 'Excelente balance';
  }

  // ====== Helpers / acciones ======
  trackById(_: number, item: { id: Id }) { return item.id; }

  asignar(op: any) {
    console.log('Asignar operador', op);
    this.router.navigateByUrl('/panel/operadores/asignaciones');
  }

  verDetalle(v: any) {
    console.log('Detalle viaje', v);
    this.router.navigateByUrl('/panel/viajes/detalles');
  }

  sugerirAsignacion(r: any) {
    console.log('Sugerir asignación a rezagado', r);
    this.router.navigateByUrl('/panel/operadores/asignaciones');
  }

  irAsignaciones() {
    this.router.navigateByUrl('/panel/operadores/asignaciones');
  }

  irReportes() {
    this.router.navigateByUrl('/panel/unidades/reportes');
  }
}
