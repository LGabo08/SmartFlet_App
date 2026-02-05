import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import type { Usuario } from 'src/models/usuario.model';

export interface CreateUsuarioRequest {
  email: string;
  nombre: string;
  apellidos: string;
  contrasena: string;
  role_id: number;
  estado?: string;
}

export interface UpdateUsuarioRequest {
  email: string;
  nombre: string;
  apellidos: string;
  contrasena?: string; // opcional al editar
  role_id: number;
  estado?: string;
}

export interface UsuarioListResponse {
  ok: boolean;
  usuarios: Usuario[];
}

export interface UsuarioOneResponse {
  ok: boolean;
  usuario: Usuario;
}

export interface GenericResponse {
  ok: boolean;
  message?: string;
  errors?: any;
  usuario?: Usuario;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(body: CreateUsuarioRequest): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.baseUrl}/usuarios`, body);
  }

  list(): Observable<UsuarioListResponse> {
    return this.http.get<UsuarioListResponse>(`${this.baseUrl}/usuarios`);
  }

  get(id: number): Observable<UsuarioOneResponse> {
    return this.http.get<UsuarioOneResponse>(`${this.baseUrl}/usuarios/${id}`);
  }

  update(id: number, body: UpdateUsuarioRequest): Observable<GenericResponse> {
    return this.http.put<GenericResponse>(`${this.baseUrl}/usuarios/${id}`, body);
  }
  getById(id: number) {
  return this.http.get<any>(`${this.baseUrl}/usuarios/${id}`);
}

  remove(id: number): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.baseUrl}/usuarios/${id}`);
  }
  
}
