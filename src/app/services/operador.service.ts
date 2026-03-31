import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Operador } from 'src/models/operador.model';

@Injectable({ 
  providedIn: 'root',
})
export class OperadorService {
  private baseUrl = `${environment.apiUrl}/operadores`;

  constructor(private http: HttpClient) {}

  // 🔹 YA EXISTENTE (NO TOCAR)
  getOperadores(): Observable<Operador[]> {
    return this.http.get<Operador[]>(this.baseUrl);
  }

  // 🔹 YA EXISTENTE (NO TOCAR)
  getOperador(id: number): Observable<Operador> {
    return this.http.get<Operador>(`${this.baseUrl}/${id}`);
  }

  // ==============================
  // NUEVAS FUNCIONES CRUD
  // ==============================

  // Crear operador
  createOperador(payload: Omit<Operador, 'id_operador'>): Observable<Operador> {
    return this.http.post<any>(this.baseUrl, payload).pipe(
      map(res => res.operador ?? res)
    );
  }

  // Actualizar operador
  updateOperador(id: number, payload: Partial<Operador>): Observable<Operador> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload).pipe(
      map(res => res.operador ?? res)
    );
  }

  // Eliminar operador
  deleteOperador(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  // ==============================
  // NUEVAS FUNCIONES PARA OBTENER LICENCIAS
  // ==============================

  // Obtener todas las licencias
// En OperadorService
getLicencias(): Observable<any> {
  return this.http.get<any>(`${environment.apiUrl}/licencias`).pipe(
    map(res => res?.licencias ?? []) // Aseguramos que se regrese la propiedad `licencias` de la respuesta.
  );
}

getHistorialEstado(idOperador: number, filtros?: {
  estado_anterior?: string;
  estado_nuevo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Observable<any> {
  let params: any = {};
  if (filtros?.estado_anterior) params.estado_anterior = filtros.estado_anterior;
  if (filtros?.estado_nuevo)    params.estado_nuevo    = filtros.estado_nuevo;
  if (filtros?.fecha_desde)     params.fecha_desde     = filtros.fecha_desde;
  if (filtros?.fecha_hasta)     params.fecha_hasta     = filtros.fecha_hasta;
  return this.http.get(`${this.baseUrl}/${idOperador}/historial-estado`, { params });
}

getHistorialZona(idOperador: number, filtros?: {
  zona_anterior?: string;
  zona_nueva?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Observable<any> {
  let params: any = {};
  if (filtros?.zona_anterior) params.zona_anterior = filtros.zona_anterior;
  if (filtros?.zona_nueva)    params.zona_nueva    = filtros.zona_nueva;
  if (filtros?.fecha_desde)   params.fecha_desde   = filtros.fecha_desde;
  if (filtros?.fecha_hasta)   params.fecha_hasta   = filtros.fecha_hasta;
  return this.http.get(`${this.baseUrl}/${idOperador}/historial-zona`, { params });
}

cambiarEstadoOperador(idOperador: number, payload: { estado_nuevo: string; motivo: string }): Observable<any> {
  return this.http.post(`${this.baseUrl}/${idOperador}/cambiar-estado`, payload);
}

cambiarZonaOperador(idOperador: number, payload: { zona_nueva: number; motivo: string }): Observable<any> {
  return this.http.post(`${this.baseUrl}/${idOperador}/cambiar-zona`, payload);
}
}