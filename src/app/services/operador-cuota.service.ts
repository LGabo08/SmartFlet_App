import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OperadorCuota {
  id_op_cuota?: number;
  fk_operador: number;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  cuota_objetivo: number;
  cuota_realizada: number;
  cuota_restante?: number;
  estado_cuota?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OperadorCuotaService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // ── Cuotas por operador individual (página cuotas-operador existente) ──
  getCuotasPorOperador(idOperador: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/operadores/${idOperador}/cuotas`);
  }

  // ── NUEVO: todos los operadores con sus cuotas (página global) ──
  getAllCuotas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/operadores/cuotas-global`);
  }

  // ── Movimientos: acepta rango de fechas en lugar de periodo ──
  // El backend usa fecha_inicio y fecha_fin como query params.
  // Si no se mandan, el backend aplica por defecto los últimos 7 días.
  obtenerMovimientos(
    id_operador: number,
    fecha_inicio?: string,
    fecha_fin?: string
  ): Observable<any> {
    let params = new HttpParams();
    if (fecha_inicio) params = params.set('fecha_inicio', fecha_inicio);
    if (fecha_fin)    params = params.set('fecha_fin',    fecha_fin);
    return this.http.get(
      `${this.apiUrl}/operadores/${id_operador}/movimientos`,
      { params }
    );
  }

  getCuotaById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/operador-cuotas/${id}`);
  }

  createCuota(payload: OperadorCuota): Observable<any> {
    return this.http.post(`${this.apiUrl}/operador-cuotas`, payload);
  }

  updateCuota(id: number, payload: Partial<OperadorCuota>): Observable<any> {
    return this.http.put(`${this.apiUrl}/operador-cuotas/${id}`, payload);
  }

  deleteCuota(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/operador-cuotas/${id}`);
  }
}