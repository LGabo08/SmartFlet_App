import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ruta } from 'src/models/ruta.model';
import { Licencia } from 'src/models/licencia.model';
import { Certificacion } from 'src/models/certificacion.model';

@Injectable({
  providedIn: 'root',
})
export class DatosViajeService {
  private apiUrl = 'http://localhost:8000/api'; // URL de tu API

  constructor(private http: HttpClient) {}

  // Obtener todas las rutas
  getRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/rutas`);
  }

  // Obtener todas las licencias
  getLicencias(): Observable<Licencia[]> {
    return this.http.get<Licencia[]>(`${this.apiUrl}/licencias`);
  }

  // Obtener todas las certificaciones
  getCertificaciones(): Observable<Certificacion[]> {
    return this.http.get<Certificacion[]>(`${this.apiUrl}/certificaciones`);
  }
}