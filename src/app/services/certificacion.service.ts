import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment'; // Asegúrate de tener la URL base en tu entorno
import { Certificacion } from 'src/models/certificacion.model'; // Modelo de certificación

@Injectable({
  providedIn: 'root'
})
export class CertificacionService {
  private apiUrl = `${environment.apiUrl}/certificaciones`; // URL base para las certificaciones

  constructor(private http: HttpClient) {}

  // Obtener todas las certificaciones
  getCertificaciones(): Observable<Certificacion[]> {
    return this.http.get<Certificacion[]>(this.apiUrl);
  }

  // Obtener certificaciones por cliente
  getCertificacionesPorCliente(clienteId: string): Observable<Certificacion[]> {
    return this.http.get<Certificacion[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // Crear una nueva certificación
  createCertificacion(certificacion: Certificacion): Observable<Certificacion> {
    return this.http.post<Certificacion>(this.apiUrl, certificacion);
  }

  // Actualizar una certificación
updateCertificacion(id: number, certificacion: Certificacion): Observable<Certificacion> {
  return this.http.put<Certificacion>(`${this.apiUrl}/${id}`, certificacion);
}

  // Eliminar una certificación
  deleteCertificacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}