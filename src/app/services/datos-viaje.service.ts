import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ruta } from 'src/models/ruta.model';
import { Licencia } from 'src/models/licencia.model';
import { Certificacion } from 'src/models/certificacion.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DatosViajeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/rutas`);
  }

  getLicencias(): Observable<Licencia[]> {
    return this.http.get<Licencia[]>(`${this.apiUrl}/licencias`);
  }

  getCertificaciones(): Observable<Certificacion[]> {
    return this.http.get<Certificacion[]>(`${this.apiUrl}/certificaciones`);
  }

  getCertificacionesPorCliente(clienteId: number): Observable<Certificacion[]> {
    return this.http.get<Certificacion[]>(`${this.apiUrl}/certificaciones/cliente/${clienteId}`);
  }

  // ✅ Un solo getClientes apuntando al selector
  getClientes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clientes/selector`);
  }

  getZonas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/zonas`);
  }
}