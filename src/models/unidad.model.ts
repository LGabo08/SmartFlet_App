export interface Unidad {
  id_unidad: number;
  numero_economico: string;
  fk_zona_actual: number | null;
  estado: string;
  fk_licencia_requerida: number | null;
}