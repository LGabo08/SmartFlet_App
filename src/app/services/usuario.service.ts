import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import type { Usuario } from 'src/models/usuario.model';

export interface CreateUsuarioRequest {
  email: string;
  apellidos: string;
  contrasena: string;
  role_id: number;
  estado?: string; // 'activo' | 'inactivo'
}

export interface CreateUsuarioResponse {
  ok: boolean;
  usuario?: Usuario;
  errors?: any;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(body: CreateUsuarioRequest): Observable<CreateUsuarioResponse> {
    return this.http.post<CreateUsuarioResponse>(`${this.baseUrl}/usuarios`, body);
  }
}
