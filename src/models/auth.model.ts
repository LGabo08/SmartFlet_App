import type { Usuario } from './usuario.model';

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface AuthResponse {
  ok: boolean;
  token: string;
  token_type: 'bearer';
  expires_in: number;
  usuario: Usuario;
  message?: string;
  errors?: any;
}
