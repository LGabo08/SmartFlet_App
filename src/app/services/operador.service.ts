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
}