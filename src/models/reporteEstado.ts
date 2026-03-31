export interface ReporteEstado {
  id_reporte: number;
  fk_unidad: number;
  estado_anterior: string;
  estado_nuevo: string;
  motivo: string;
  fecha_reporte: Date;
}