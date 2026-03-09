import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Unidad } from 'src/models/unidad.model';

@Injectable({ providedIn: 'root' })
export class UnidadService {
  private baseUrl = `${environment.apiUrl}/unidades`;

  constructor(private http: HttpClient) {}

  // Obtener todas las unidades
  getUnidades(): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(this.baseUrl);  // Directamente devolvemos el array
  }

  // Obtener una unidad por su ID
  getUnidad(id: string): Observable<Unidad> {
    return this.http.get<Unidad>(`${this.baseUrl}/${id}`);
  }

  // Crear una nueva unidad
  createUnidad(data: Unidad): Observable<Unidad> {
    return this.http.post<Unidad>(this.baseUrl, data);
  }

  // Actualizar los datos de una unidad
  updateUnidad(id: string, data: Unidad): Observable<Unidad> {
    return this.http.put<Unidad>(`${this.baseUrl}/${id}`, data);
  }

  // Eliminar una unidad
  deleteUnidad(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  // Cambiar el estado de una unidad y registrar el motivo en la tabla de reportes
  cambiarEstado(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}/cambiar-estado`, data);
  }
}