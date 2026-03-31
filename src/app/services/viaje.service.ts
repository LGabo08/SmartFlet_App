import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Viaje } from 'src/models/viaje.model';

@Injectable({
  providedIn: 'root'
})
export class ViajeService {
  private baseUrl  = `${environment.apiUrl}/viajes`;
  private zonasUrl = `${environment.apiUrl}/zonas`;

  constructor(private http: HttpClient) {}

  getViajes(): Observable<Viaje[]> {
    return this.http.get<Viaje[]>(this.baseUrl);
  }

  getViajeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  getViaje(id: number): Observable<Viaje> {
    return this.http.get<Viaje>(`${this.baseUrl}/${id}`);
  }

  createViaje(viaje: Viaje): Observable<any> {
    return this.http.post(this.baseUrl, viaje);
  }

  // Agrega este método al ViajeService
getViajesCancelados(): Observable<any> {
  return this.http.get(`${this.baseUrl}?estado=CANCELADO`);
}
  updateViaje(viaje: Viaje): Observable<any> {
    return this.http.put(`${this.baseUrl}/${viaje.id_viaje}`, viaje);
  }

  deleteViaje(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getZonas(): Observable<any[]> {
    return this.http.get<any[]>(this.zonasUrl);
  }

  // ✅ FIX: URL corregida a /${id}/cancelar y payload unificado
  cancelarViaje(id: number, payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/cancelar`, payload);
  }

  obtenerCadenaViaje(idViaje: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${idViaje}/cadena`);
  }
}