
export interface Viaje {
  id_viaje: number;               // ID del viaje
  numero_viaje: string;           // Número del viaje
  fk_ruta: number;                // Ruta asociada
  fk_licencia_requerida: number;  // Licencia requerida
  fk_certificacion_requerida: number; // Certificación requerida
  fk_operador: number;            // Operador
  fk_unidad: number;              // Unidad
  fecha_salida: string;           // Fecha de salida
  fecha_llegada: string;          // Fecha de llegada
  estado: 'PENDIENTE' | 'ASIGNADO' | 'EN_CURSO' | 'TERMINADO' | 'CANCELADO'; // Estado del viaje
  pago_operador: number;          // Pago del operador
}