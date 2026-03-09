// operador.model.ts
export interface Operador {
  id_operador: number;
  numero_empleado: string;
  nombres: string;
  apellidos: string;
  fk_zona_actual: number;
  fk_tipo_licencia: number;
  vigencia_licencia: string; // DATE -> string ISO (ej: "2026-03-02")
  estado_operador: 'DISPONIBLE' | 'NO_DISPONIBLE' | 'INACTIVO' | string;
  fk_unidad_asignada: number | null;
}

export interface OperadoresIndexResponse {
  ok: boolean;
  operadores: Operador[];
}

export interface OperadorShowResponse {
  ok: boolean;
  operador: Operador;
}

export interface ApiMsgResponse {
  ok: boolean;
  msg: string;
}