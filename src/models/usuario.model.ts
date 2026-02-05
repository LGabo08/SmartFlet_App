export type EstadoUsuario = 'activo' | 'inactivo' | 'bloqueado' | string;

export interface Usuario {
  idUsuario: number;  
  email: string;
  nombre: string;
  apellidos: string;
  estado: EstadoUsuario;
  role_id: number;

  created_at?: string | null;
  updated_at?: string | null;
}
