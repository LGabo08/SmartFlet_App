// src/models/viaje.model.ts
export interface Viaje {
  id_viaje: number;
  numero_viaje: string;
  fk_ruta: number;
  fk_licencia_requerida: number;



  fk_operador: number;
  fk_unidad: number;
  fecha_salida: string;
  fecha_llegada: string;
  estado: string;
  pago_operador: number;

 
  certificaciones: Array<{
    id_certificacion?: number;
    nombre_certificacion?: string;
  }>;


  numero_economico: string;
  operador_nombre: string;
  operador_apellidos: string;


  nombre_certificacion?: string;

  nombre_ruta: string;
  nombre_licencia: string;


  configuracion_unidad: string;  // Nuevo campo
  cliente: string;              // Nuevo campo
  producto: string;             // Nuevo campo
}