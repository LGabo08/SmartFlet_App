
// src/app/services/viaje.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Viaje } from 'src/models/viaje.model';  // Define el tipo Viaje en src/models/viaje.model.ts

@Injectable({
  providedIn: 'root'
})
export class ViajeService {
  private baseUrl = `${environment.apiUrl}/viajes`;  // URL base de la API Laravel

  constructor(private http: HttpClient) {}

  // Obtener todos los viajes
  getViajes(): Observable<Viaje[]> {
    return this.http.get<Viaje[]>(this.baseUrl);
  }

  // Obtener un viaje por ID
  getViaje(id: number): Observable<Viaje> {
    return this.http.get<Viaje>(`${this.baseUrl}/${id}`);
  }

  // Crear un nuevo viaje
  createViaje(viaje: Viaje): Observable<any> {
    return this.http.post(this.baseUrl, viaje);
  }

  // Actualizar un viaje
  updateViaje(id: number, viaje: Viaje): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, viaje);
  }

  // Eliminar un viaje
  deleteViaje(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}