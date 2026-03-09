export interface Ruta {
  id_ruta: number;
  fk_zona_origen: number;
  fk_zona_destino: number;
  distancia_km: number;
  tarifa_operador: number;
  nombre_ruta: string;  // Agregado el nombre de la ruta
}