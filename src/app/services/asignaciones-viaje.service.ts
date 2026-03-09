import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AsignacionesViajeService {
  private baseUrl = `${environment.apiUrl}/viajes`;  // Asegúrate de que la URL sea correcta

  constructor(private http: HttpClient) {}

  // Obtener viajes pendientes
  obtenerViajesPendientes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/pendientes`);
  }

  // Aprobar viaje al operador
  aprobarViaje(id_viaje: number, operadorId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id_viaje}/aprobar`, { operadorId });
  }

rechazarViaje(id_viaje: number, operadorId: number, motivos: string) {
  return this.http.post(`${this.baseUrl}/${id_viaje}/rechazar`, {
    operadorId,
    motivos: String(motivos || '').trim(),
  });
}
  // Reasignar viaje
  reasignarViaje(id_viaje: number, operadorId: number, unidadId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id_viaje}/reasignar`, { operadorId, unidadId });
  }

  // Método para calcular asignación y obtener la respuesta del algoritmo
  calcularAsignacion(id_viaje: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id_viaje}/calcular-asignacion`, {});
  }
}