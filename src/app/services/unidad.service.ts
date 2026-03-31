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
    return this.http.get<Unidad[]>(this.baseUrl);
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

  // Obtener el historial de cambios de estado de la unidad
  getHistorial(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/historial`);
  }

  // Obtener el historial de cambios de estado de la unidad
  getHistorialEstado(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/historial-estado`);
  }

  // Obtener las licencias
  getLicencias(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/licencias`);
  }

  // Obtener las zonas
  getZonas(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/zonas`);  // Llamada a la API para obtener las zonas
  }

  getUnidadDetalle(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/${id}/detalle`);
}

asignarOperador(id: number, idOperador: number): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/${id}/asignar-operador`, { id_operador: idOperador });
}

quitarOperador(id: number): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/${id}/quitar-operador`, {});
}

getHistorialZona(id: number, filtros?: any): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/${id}/historial-zona`, { params: filtros ?? {} });
}

getHistorialEstadoFiltrado(id: number, filtros?: any): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/${id}/historial-estado-filtrado`, { params: filtros ?? {} });
}

cambiarZona(id: number, data: { zona_nueva: number; motivo: string }): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}/${id}/cambiar-estado`, data);
}

cambiarZonaUnidad(id: number, data: { zona_nueva: number; motivo: string }): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/${id}/cambiar-zona`, data);
}

getHistorialOperadores(id: number, filtros?: any): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/${id}/historial-operadores`, { params: filtros ?? {} });
}
}