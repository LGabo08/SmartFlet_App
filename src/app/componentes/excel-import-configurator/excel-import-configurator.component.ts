import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { IonicModule }  from '@ionic/angular';

// npm install xlsx
import * as XLSX from 'xlsx';

import { Ruta }          from 'src/models/ruta.model';
import { Licencia }      from 'src/models/licencia.model';
import { Certificacion } from 'src/models/certificacion.model';
import { Cliente }       from 'src/models/cliente.model';
import { DatosViajeService } from 'src/app/services/datos-viaje.service';

export type CampoSistema =
  | 'numero_viaje'
  | 'origen'
  | 'destino'
  | 'configuracion_unidad'
  | 'cliente'
  | 'producto'
;


export interface MapeoColumnas {
  numero_viaje?:         string;
  origen?:               string;
  destino?:              string;
  configuracion_unidad?: string;
  cliente?:              string;
  producto?:             string;
}

export interface DatosFijos {
  fk_ruta?:         number;
  id_cliente?:      number;
  certificaciones?: number[];
}

export type EstadoFila = 'pendiente' | 'enviando' | 'ok' | 'error';

export interface FilaProcesada {
  _idx:              number;
  _editando:         boolean;
  numero_viaje:      string;
  rutaResuelta?:     Ruta;
  rutaTexto:         string;
  fk_ruta_edit:      number | undefined;
  configuracion:     string;
  licenciaAuto?:     Licencia;
  fk_licencia_edit:  number | undefined;
  clienteResuelto?:  Cliente;
  clienteTexto:      string;
  id_cliente_edit:   number | undefined;
  producto:          string;
  cita_carga:        string;
  pago_operador:     number;
  certificaciones:   number[];
  errores:           string[];
  advertencias:      string[];
  payload:           any | null;
  estado:            EstadoFila;
  mensajeApi:        string;
}

const KW_SENCILLO = ['sencillo','simple','tolva','plana','caja','cama','lowboy'];
const KW_DOBLE    = ['doble','full','encortinado','cortina','doblequipo','full trailer'];

function sanitize(s: any): string {
  return String(s ?? '').replace(/<[^>]*>/g,'').replace(/[<>"'\`;]/g,'').trim();
}
function norm(s: any): string {
  return String(s ?? '').toLowerCase().trim();
}

@Component({
  selector: 'app-excel-import-configurator',
  standalone: true,
  templateUrl: './excel-import-configurator.component.html',
  styleUrls:   ['./excel-import-configurator.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ExcelImportConfiguratorComponent implements OnInit {

  @Input() rutas:               Ruta[]          = [];
  @Input() licencias:           Licencia[]      = [];
  @Input() clientes:            Cliente[]       = [];
  @Input() certificaciones:     Certificacion[] = [];
  @Input() configuracionesUnidad: string[]      = [];
  @Input() createViajeFn!:      (payload: any) => Promise<any>;

  @Output() cargaCompletada = new EventEmitter<{ ok: number; errores: number }>();
  @Output() cerrar          = new EventEmitter<void>();

  paso: 1 | 2 | 3 | 4 = 1;

  archivoNombre  = '';
  columnasExcel: string[] = [];
  rawRows:       any[]    = [];
  errorArchivo   = '';

  mapeo: MapeoColumnas = {};
  camposConfig = [
    { campo: 'numero_viaje'         as CampoSistema, label: 'No. de Viaje / Embarque', descripcion: 'Identificador único del viaje.',                                    requerido: true,  icono: 'receipt-outline'   },
    { campo: 'origen'               as CampoSistema, label: 'Columna de Origen',        descripcion: 'Ciudad o zona de origen.',                                          requerido: false, icono: 'location-outline'  },
    { campo: 'destino'              as CampoSistema, label: 'Columna de Destino',       descripcion: 'Ciudad o zona de destino.',                                         requerido: false, icono: 'flag-outline'      },
    { campo: 'configuracion_unidad' as CampoSistema, label: 'Configuración de Unidad',  descripcion: 'Tipo de unidad — la licencia se asigna automáticamente.',           requerido: false, icono: 'car-outline'       },
    { campo: 'cliente'              as CampoSistema, label: 'Cliente',                  descripcion: 'Nombre del cliente. Sus certificaciones se cargan automáticamente.', requerido: false, icono: 'business-outline'  },
    { campo: 'producto'             as CampoSistema, label: 'Producto',                 descripcion: 'Descripción de la carga.',                                           requerido: false, icono: 'cube-outline'      },
  ];

  datosFijos: DatosFijos = { fk_ruta: undefined, id_cliente: undefined, certificaciones: [] };
  pagoGlobal: number = 0;
  certsClienteFijo: Certificacion[] = [];

  get clienteDesdeExcel(): boolean { return !!this.mapeo.cliente; }
  get rutaDesdeExcel():    boolean { return !!(this.mapeo.origen || this.mapeo.destino); }

  filasProcessadas: FilaProcesada[] = [];
  enviandoMasivo = false;
  resultado: { ok: number; errores: number } | null = null;

  get filasValidas():        number { return this.filasProcessadas.filter(f => f.estado === 'pendiente').length; }
  get filasConError():       number { return this.filasProcessadas.filter(f => f.errores.length > 0 && f.estado !== 'ok').length; }
  get filasOk():             number { return this.filasProcessadas.filter(f => f.estado === 'ok').length; }
  get filasConAdvertencia(): number {
    return this.filasProcessadas.filter(f => f.advertencias.length > 0 && f.errores.length === 0 && f.estado !== 'ok').length;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private datosViajeService: DatosViajeService,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    // Crear input file en el body — fuera de cualquier restricción de Ionic
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    input.id = 'eic-body-input';
    input.addEventListener('change', (e) => this.ngZone.run(() => this.onArchivoSeleccionado(e)));
    document.body.appendChild(input);
  }

  ngOnDestroy() {
    // Limpiar el input al destruir el componente
    document.getElementById('eic-body-input')?.remove();
  }

  abrirSelectorBody() {
    console.log('[BODY INPUT] llamando click');
    document.getElementById('eic-body-input')?.click();
  }

  logInputClick(e: MouseEvent) {
    console.log('[INPUT CLICK] disparado, isTrusted:', e.isTrusted);
  }

  onArchivoSeleccionado(e: Event) {
    const input = e.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    this.ngZone.run(() => {
      this.archivoNombre = file.name;
      this.errorArchivo  = '';
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        try {
          const wb   = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
          if (!rows.length) { this.errorArchivo = 'El archivo no tiene datos en la primera hoja.'; return; }
          this.rawRows       = rows;
          this.columnasExcel = Object.keys(rows[0]);
          this.autoMapear();
          this.paso = 2;
          this.cdr.markForCheck();
        } catch { this.errorArchivo = 'No se pudo leer el archivo. Verifica que sea .xlsx o .xls válido.'; }
      };
      reader.readAsArrayBuffer(file);
      input.value = '';
    });
  }

  private autoMapear() {
    const alias: Record<CampoSistema, string[]> = {
      numero_viaje:          ['viaje','embarque','no.','numero','folio','#viaje','num'],
      origen:                ['origen','origin','salida','from','de'],
      destino:               ['destino','destination','llegada','to','hacia'],
      configuracion_unidad:  ['config','unidad','equipo','tipo','configuracion','vehiculo'],
      cliente:               ['cliente','client','customer','empresa','razon'],
      producto:              ['producto','carga','mercanc','material'],

    };
    this.mapeo = {};
    for (const col of this.columnasExcel) {
      const cn = norm(col);
      for (const [campo, palabras] of Object.entries(alias)) {
        if (palabras.some(p => cn.includes(p)) && !(this.mapeo as any)[campo]) {
          (this.mapeo as any)[campo] = col;
        }
      }
    }
  }

  irAPaso3() {
    if (!this.mapeo.numero_viaje) { alert('Debes mapear al menos el campo "No. de Viaje / Embarque".'); return; }
    this.datosFijos = { fk_ruta: undefined, id_cliente: undefined, certificaciones: [] };
    this.certsClienteFijo = [];
    this.paso = 3;
  }

  onClienteFijoChange(idCliente: number | undefined) {
    this.datosFijos.certificaciones = [];
    this.certsClienteFijo = [];
    if (!idCliente) return;
    this.datosViajeService.getCertificacionesPorCliente(Number(idCliente)).subscribe({
      next: (data: any) => {
        this.certsClienteFijo           = Array.isArray(data) ? data : [];
        this.datosFijos.certificaciones = this.certsClienteFijo.map(c => c.id_certificacion!);
        this.cdr.markForCheck();
      },
    });
  }

  toggleCertFijo(id: number) {
    const certs = this.datosFijos.certificaciones ?? [];
    this.datosFijos.certificaciones = certs.includes(id) ? certs.filter(c => c !== id) : [...certs, id];
  }

  isCertFijoSelected(id: number): boolean {
    return (this.datosFijos.certificaciones ?? []).includes(id);
  }

  irAPaso4() {
    this.filasProcessadas = this.rawRows.map((row, i) => this.procesarFila(row, i));
    this.resultado = null;
    this.paso = 4;
  }

  private procesarFila(row: any, idx: number): FilaProcesada {
    const errores: string[] = [], advertencias: string[] = [];

    const numero_viaje = sanitize(row[this.mapeo.numero_viaje ?? '']);
    if (!numero_viaje) errores.push('Número de viaje vacío.');
    else if (!/^[a-zA-Z0-9\-\.\/\s]+$/.test(numero_viaje)) errores.push('Número de viaje con caracteres no permitidos.');

    const origenTexto  = sanitize(row[this.mapeo.origen  ?? '']);
    const destinoTexto = sanitize(row[this.mapeo.destino ?? '']);
    const rutaTexto    = [origenTexto, destinoTexto].filter(Boolean).join(' → ');
    let rutaResuelta: Ruta | undefined;

    if (this.mapeo.origen || this.mapeo.destino) {
      rutaResuelta = this.buscarRuta(origenTexto, destinoTexto);
      if (!rutaResuelta) advertencias.push(`Ruta "${rutaTexto}" no encontrada — edita la fila para seleccionarla.`);
    }
    if (!rutaResuelta && this.datosFijos.fk_ruta)
      rutaResuelta = this.rutas.find(r => r.id_ruta === this.datosFijos.fk_ruta);
    if (!rutaResuelta) errores.push('No se pudo determinar la ruta.');

    const configRaw  = sanitize(row[this.mapeo.configuracion_unidad ?? '']);
    const configNorm = norm(configRaw);
    let licenciaAuto: Licencia | undefined;

    if (configRaw) {
      if (KW_SENCILLO.some(k => configNorm.includes(k)))
        licenciaAuto = this.licencias.find(l => norm(l.descripcion_licencia).includes('sencillo') || norm(l.descripcion_licencia).includes('tipo a') || norm(l.nombre_licencia).includes('a'));
      else if (KW_DOBLE.some(k => configNorm.includes(k)))
        licenciaAuto = this.licencias.find(l => norm(l.descripcion_licencia).includes('doble') || norm(l.descripcion_licencia).includes('tipo b') || norm(l.nombre_licencia).includes('b'));
      if (!licenciaAuto) { advertencias.push(`Sin licencia detectada para "${configRaw}". Se usará la primera.`); licenciaAuto = this.licencias[0]; }
    } else {
      licenciaAuto = this.licencias[0];
      advertencias.push('Sin configuración de unidad — se usará la primera licencia disponible.');
    }

    const clienteTexto = sanitize(row[this.mapeo.cliente ?? '']) || '';
    let clienteResuelto: Cliente | undefined;
    if (this.mapeo.cliente && clienteTexto) {
      clienteResuelto = this.clientes.find(c => norm(c.nombre_cliente) === norm(clienteTexto) || norm(c.nombre_cliente).includes(norm(clienteTexto)) || norm(clienteTexto).includes(norm(c.nombre_cliente)));
      if (!clienteResuelto) advertencias.push(`Cliente "${clienteTexto}" no encontrado — edita la fila para seleccionarlo.`);
    }
    if (!clienteResuelto && this.datosFijos.id_cliente)
      clienteResuelto = this.clientes.find(c => c.id_cliente === this.datosFijos.id_cliente);
    if (!clienteResuelto) errores.push('No se pudo determinar el cliente.');

    const certIds    = [...(this.datosFijos.certificaciones ?? [])];
    const producto   = sanitize(row[this.mapeo.producto   ?? '']);


    let payload: any = null;
    if (errores.length === 0 && rutaResuelta && clienteResuelto && licenciaAuto) {
      payload = {
        numero_viaje:          sanitize(numero_viaje),
        fk_ruta:               rutaResuelta.id_ruta,
        configuracion_unidad:  configRaw || 'N/A',
        fk_licencia_requerida: licenciaAuto.id_licencia,
        producto:              producto || 'N/A',
        cliente:               sanitize(clienteResuelto.nombre_cliente),
        id_cliente:            clienteResuelto.id_cliente,
        estado:                'PENDIENTE',
        certificaciones:       certIds ?? [],
        pago_operador:         this.pagoGlobal ?? 0,
      };
    }

    return {
      _idx: idx + 1, _editando: false,
      numero_viaje, rutaResuelta, rutaTexto: rutaTexto || '—',
      fk_ruta_edit:     rutaResuelta?.id_ruta   ?? this.datosFijos.fk_ruta,
      configuracion:    configRaw || '—', licenciaAuto,
      fk_licencia_edit: licenciaAuto?.id_licencia,
      clienteResuelto,  clienteTexto: clienteTexto || '—',
      id_cliente_edit:  clienteResuelto?.id_cliente ?? this.datosFijos.id_cliente,
      producto: producto || '—', cita_carga: '—',
      pago_operador: this.pagoGlobal ?? 0, certificaciones: certIds,
      errores, advertencias, payload,
      estado: errores.length > 0 ? 'error' : 'pendiente',
      mensajeApi: '',
    };
  }

  private buscarRuta(origen: string, destino: string): Ruta | undefined {
    if (!origen && !destino) return undefined;
    return this.rutas.find(r => {
      const n = norm(r.nombre_ruta), o = norm(origen), d = norm(destino);
      if (o && d) return n.includes(o) && n.includes(d);
      if (o)      return n.includes(o);
      if (d)      return n.includes(d);
      return false;
    });
  }

  toggleEdicion(fila: FilaProcesada) { fila._editando = !fila._editando; }

  /** Al cambiar la config de unidad en edición, auto-detecta la licencia */
  onConfigFilaChange(fila: FilaProcesada, config: string) {
    const cn = norm(config);
    let licencia: Licencia | undefined;

    if (KW_SENCILLO.some(k => cn.includes(k))) {
      licencia = this.licencias.find(l =>
        norm(l.descripcion_licencia).includes('sencillo') ||
        norm(l.descripcion_licencia).includes('tipo a') ||
        norm(l.nombre_licencia).includes('a')
      );
    } else if (KW_DOBLE.some(k => cn.includes(k))) {
      licencia = this.licencias.find(l =>
        norm(l.descripcion_licencia).includes('doble') ||
        norm(l.descripcion_licencia).includes('tipo b') ||
        norm(l.nombre_licencia).includes('b')
      );
    }

    if (!licencia) licencia = this.licencias[0];
    fila.licenciaAuto    = licencia;
    fila.fk_licencia_edit = licencia?.id_licencia;
    this.cdr.markForCheck();
  }

  onClienteFilaChange(fila: FilaProcesada, idCliente: number | undefined) {
    fila.id_cliente_edit = idCliente;
    if (!idCliente) return;
    this.datosViajeService.getCertificacionesPorCliente(Number(idCliente)).subscribe({
      next: (data: any) => {
        const certs: Certificacion[] = Array.isArray(data) ? data : [];
        fila.certificaciones = certs.map(c => c.id_certificacion!);
        this.cdr.markForCheck();
      },
    });
  }

  guardarEdicion(fila: FilaProcesada) {
    const rutaResuelta    = this.rutas.find(r => r.id_ruta === Number(fila.fk_ruta_edit));
    const licenciaAuto    = this.licencias.find(l => l.id_licencia === Number(fila.fk_licencia_edit)) ?? this.licencias[0];
    const clienteResuelto = this.clientes.find(c => c.id_cliente === Number(fila.id_cliente_edit));
    fila.rutaResuelta = rutaResuelta; fila.licenciaAuto = licenciaAuto; fila.clienteResuelto = clienteResuelto;
    const errores: string[] = [];
    if (!fila.numero_viaje) errores.push('Número de viaje vacío.');
    if (!rutaResuelta)      errores.push('Selecciona una ruta válida.');
    if (!clienteResuelto)   errores.push('Selecciona un cliente válido.');
    fila.errores = errores;
    if (errores.length === 0 && rutaResuelta && clienteResuelto && licenciaAuto) {
      fila.payload = {
        numero_viaje:          sanitize(fila.numero_viaje),
        fk_ruta:               rutaResuelta.id_ruta,
        configuracion_unidad:  fila.configuracion !== '—' ? fila.configuracion : 'N/A',
        fk_licencia_requerida: licenciaAuto.id_licencia,
        producto:              fila.producto !== '—' ? fila.producto : 'N/A',
        cliente:               sanitize(clienteResuelto.nombre_cliente),
        id_cliente:            clienteResuelto.id_cliente,
        estado:                'PENDIENTE',
        certificaciones:       fila.certificaciones,
        pago_operador:         fila.pago_operador ?? 0,
      };
      fila.estado = 'pendiente';
    }
    fila._editando = false;
    this.cdr.markForCheck();
  }

  eliminarFila(i: number) { this.filasProcessadas.splice(i, 1); this.cdr.markForCheck(); }

  async enviarMasivo() {
    const validas = this.filasProcessadas.filter(f => f.estado === 'pendiente' && f.payload);
    if (!validas.length) return;
    this.enviandoMasivo = true;
    let ok = 0, errores = 0;
    for (const fila of validas) {
      if (fila.payload) fila.payload.pago_operador = fila.pago_operador ?? 0;
      fila.estado = 'enviando'; this.cdr.markForCheck();
      try {
        const res = await this.createViajeFn(fila.payload);
        if (res?.ok) { fila.estado = 'ok';    fila.mensajeApi = 'Registrado.'; ok++;      }
        else          { fila.estado = 'error'; fila.mensajeApi = res?.message ?? 'Error.'; errores++; }
      } catch (e: any) { fila.estado = 'error'; fila.mensajeApi = e?.error?.message ?? 'Error de conexión.'; errores++; }
      this.cdr.markForCheck();
    }
    this.enviandoMasivo = false;
    this.resultado = { ok, errores };
    this.cargaCompletada.emit({ ok, errores });
    this.cdr.markForCheck();
  }

  descargarPlantilla() {
    const ws = XLSX.utils.json_to_sheet([{ 'No. Viaje': 'VJ-001', 'Origen': 'Monterrey', 'Destino': 'Guadalajara', 'Tipo de Unidad': 'Encortinado', 'Cliente': 'Empresa Ejemplo S.A.', 'Producto': 'Cemento', 'Cita de Carga': '2025-06-15 08:00' }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Viajes');
    XLSX.writeFile(wb, 'plantilla_viajes_smartflet.xlsx');
  }

  trackByIdx(_: number, item: FilaProcesada) { return item._idx; }

  volver() {
    if (this.paso > 1) this.paso = (this.paso - 1) as 1|2|3|4;
    else this.cerrar.emit();
  }
}