import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OperadorCuota {
  id_op_cuota?: number;
  fk_operador: number;
  periodo: string;
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

  getCuotasPorOperador(idOperador: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/operadores/${idOperador}/cuotas`);
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