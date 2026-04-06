import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private base  = `${environment.apiUrl}/admin/permisos`;
  private roles = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.base}/roles`);
  }

  actualizarRol(rolId: number, permisos: number[]): Observable<any> {
    return this.http.put<any>(`${this.base}/roles/${rolId}`, { permisos });
  }

  // Crea el rol base (nombre + descripcion) usando el RoleController existente
  crearRol(nombre: string, descripcion: string): Observable<any> {
    return this.http.post<any>(this.roles, { nombre, descripcion });
  }

  getPermisosUsuario(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/usuarios/${usuarioId}`);
  }

  actualizarUsuario(usuarioId: number, personalizaciones: { id: number; tipo: 'GRANT' | 'DENY' | 'NINGUNO' }[]): Observable<any> {
    return this.http.put<any>(`${this.base}/usuarios/${usuarioId}`, { personalizaciones });
  }

  sincronizar(): Observable<any> {
    return this.http.post<any>(`${this.base}/sincronizar`, {});
  }
}