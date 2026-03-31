import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AsignacionesViajeService {
  private baseUrl = `${environment.apiUrl}/viajes`;

  constructor(private http: HttpClient) {}

  obtenerViajesPendientes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/pendientes`);
  }

  // [ENCADENAMIENTO] Se agregaron id_viaje_padre y ranking_info opcionales
  aprobarViaje(
    id_viaje: number,
    id_operador: number,
    advertencias: string[] = [],
    id_viaje_padre?: number,
    ranking_info?: { pos_elegido: number; pos_mejor: number; nombre_mejor: string }
  ) {
    return this.http.post(`${this.baseUrl}/${id_viaje}/aprobar`, {
      operadorId:     id_operador,
      advertencias,
      id_viaje_padre: id_viaje_padre ?? null,
      ranking_info:   ranking_info   ?? null,
    });
  }

  rechazarViaje(id_viaje: number, operadorId: number, motivos: string) {
    return this.http.post(`${this.baseUrl}/${id_viaje}/rechazar`, {
      operadorId,
      motivos: String(motivos || '').trim(),
    });
  }

  cambiarTarifa(id_viaje: number, nueva_tarifa: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id_viaje}/cambiar-tarifa`, { nueva_tarifa });
  }

  calcularAsignacion(id_viaje: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id_viaje}/calcular-asignacion`, {});
  }

  obtenerHistorialViaje(id_viaje: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id_viaje}/historial`);
  }
reasignarViaje(idViaje: number, data: {
  motivo?: string;
  nuevo_estado_operador?: string;
  nuevo_estado_unidad?: string;
  nueva_zona_operador?: number | null;
  nueva_zona_unidad?: number | null;
  accion_viajes_encadenados?: 'continuar' | 'liberar';
}): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/${idViaje}/reasignar`, data);
}
  finalizarViaje(idViaje: number, data: {
    tipo_finalizacion: string;
    fecha_llegada_real: string;
    notas?: string | null;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${idViaje}/finalizar`, data);
  }

  getFinalizacion(idViaje: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${idViaje}/finalizacion`);
  }

  iniciarViaje(idViaje: number, fechaInicio: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${idViaje}/iniciar`, {
      fecha_inicio: fechaInicio,
    });
  }

  obtenerCadena(idViaje: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${idViaje}/cadena`);
  }
}