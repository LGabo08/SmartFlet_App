import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonSegment, IonSegmentButton, IonLabel, IonToggle, IonIcon, IonSpinner,
  ToastController, AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  syncOutline, saveOutline, chevronDownOutline, informationCircleOutline,
  shieldCheckmarkOutline, addCircleOutline,
} from 'ionicons/icons';

import { PermisoService } from 'src/app/services/permiso.service';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-configurador',
  templateUrl: './configurador.page.html',
  styleUrls: ['./configurador.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonSegment, IonSegmentButton, IonLabel, IonToggle, IonIcon, IonSpinner,
  ],
})
export class ConfiguradorPage implements OnInit {

  tab: 'roles' | 'nuevo-rol' | 'usuarios' = 'roles';

  // ── Tab Roles ──────────────────────────────────────────────────────────────
  roles:           any[]         = [];
  modulos:         any[]         = [];
  rolSeleccionado: number | null = null;
  permisosRol:     Set<number>   = new Set();
  cargandoRoles  = false;
  guardandoRol   = false;

  // ── Tab Nuevo Rol ──────────────────────────────────────────────────────────
  nuevoRol = { nombre: '', descripcion: '' };
  nuevoRolPermisos: Set<number> = new Set();
  modulosNuevoRol:  any[]       = [];
  creandoRol = false;

  // ── Tab Usuarios ───────────────────────────────────────────────────────────
  usuarios:            any[]         = [];
  usuarioSeleccionado: number | null = null;
  modulosUsuario:      any[]         = [];
  cargandoUsuario  = false;
  guardandoUsuario = false;

  sincronizando = false;

  constructor(
    private permisoSvc: PermisoService,
    private usuarioSvc: UsuarioService,
    private toast: ToastController,
    private alert: AlertController,
  ) {
    addIcons({ syncOutline, saveOutline, chevronDownOutline, informationCircleOutline, shieldCheckmarkOutline, addCircleOutline });
  }

  ngOnInit() {
    this.cargarRoles();
    this.cargarUsuarios();
  }

  // ── ROLES ──────────────────────────────────────────────────────────────────

  cargarRoles() {
    this.cargandoRoles = true;
    this.permisoSvc.getRoles().subscribe({
      next: res => {
        this.roles   = res.roles;
        this.modulos = res.modulos.map((m: any) => ({ ...m, expandido: false }));
        // Copia independiente para el tab de nuevo rol
        this.modulosNuevoRol = res.modulos.map((m: any) => ({ ...m, expandido: false }));
        if (this.roles.length) this.seleccionarRol(this.roles[0].id);
        this.cargandoRoles = false;
      },
      error: () => this.cargandoRoles = false,
    });
  }

  seleccionarRol(rolId: number) {
    this.rolSeleccionado = rolId;
    const rol = this.roles.find(r => r.id === rolId);
    this.permisosRol = new Set(rol?.permisos ?? []);
  }

  tienePermiso(permisoId: number): boolean {
    return this.permisosRol.has(permisoId);
  }

  togglePermiso(permisoId: number, activo: boolean) {
    activo ? this.permisosRol.add(permisoId) : this.permisosRol.delete(permisoId);
  }

  toggleModulo(modulo: any, activo: boolean) {
    modulo.permisos.forEach((p: any) => {
      activo ? this.permisosRol.add(p.id) : this.permisosRol.delete(p.id);
    });
  }

  toggleExpandModulo(modulo: any) {
    modulo.expandido = !modulo.expandido;
  }

  moduloCompleto(modulo: any): boolean {
    return modulo.permisos.every((p: any) => this.permisosRol.has(p.id));
  }

  contarActivos(modulo: any): number {
    return modulo.permisos.filter((p: any) => this.permisosRol.has(p.id)).length;
  }

  guardarRol() {
    if (!this.rolSeleccionado) return;
    this.guardandoRol = true;
    this.permisoSvc.actualizarRol(this.rolSeleccionado, [...this.permisosRol]).subscribe({
      next: () => {
        this.guardandoRol = false;
        this.mostrarToast('Permisos del rol guardados', 'success');
        const rol = this.roles.find(r => r.id === this.rolSeleccionado);
        if (rol) rol.permisos = [...this.permisosRol];
      },
      error: () => {
        this.guardandoRol = false;
        this.mostrarToast('Error al guardar permisos', 'danger');
      },
    });
  }

  // ── NUEVO ROL ──────────────────────────────────────────────────────────────

  togglePermisoNuevo(permisoId: number, activo: boolean) {
    activo ? this.nuevoRolPermisos.add(permisoId) : this.nuevoRolPermisos.delete(permisoId);
  }

  toggleModuloNuevo(modulo: any, activo: boolean) {
    modulo.permisos.forEach((p: any) => {
      activo ? this.nuevoRolPermisos.add(p.id) : this.nuevoRolPermisos.delete(p.id);
    });
  }

  toggleExpandModuloNuevo(modulo: any) {
    modulo.expandido = !modulo.expandido;
  }

  moduloCompletoNuevo(modulo: any): boolean {
    return modulo.permisos.every((p: any) => this.nuevoRolPermisos.has(p.id));
  }

  contarActivosNuevo(modulo: any): number {
    return modulo.permisos.filter((p: any) => this.nuevoRolPermisos.has(p.id)).length;
  }

  async crearRol() {
    if (!this.nuevoRol.nombre.trim()) return;

    const a = await this.alert.create({
      header:  'Confirmar creación',
      message: `¿Crear el rol "${this.nuevoRol.nombre}" con ${this.nuevoRolPermisos.size} permiso(s)?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: () => this.confirmarCrearRol(),
        },
      ],
    });
    await a.present();
  }

  private confirmarCrearRol() {
    this.creandoRol = true;

    // 1. Crear el rol
    this.permisoSvc.crearRol(this.nuevoRol.nombre, this.nuevoRol.descripcion).subscribe({
      next: (res) => {
        const rolId = res.role?.id;

        // 2. Si tiene permisos seleccionados, asignarlos
        if (rolId && this.nuevoRolPermisos.size > 0) {
          this.permisoSvc.actualizarRol(rolId, [...this.nuevoRolPermisos]).subscribe({
            next: () => {
              this.creandoRol = false;
              this.mostrarToast(`Rol "${this.nuevoRol.nombre}" creado con ${this.nuevoRolPermisos.size} permiso(s)`, 'success');
              this.resetNuevoRol();
              this.cargarRoles(); // refrescar lista
              this.tab = 'roles';
            },
            error: () => {
              this.creandoRol = false;
              this.mostrarToast('Rol creado pero hubo un error al asignar permisos', 'warning');
              this.resetNuevoRol();
              this.cargarRoles();
              this.tab = 'roles';
            },
          });
        } else {
          this.creandoRol = false;
          this.mostrarToast(`Rol "${this.nuevoRol.nombre}" creado sin permisos`, 'success');
          this.resetNuevoRol();
          this.cargarRoles();
          this.tab = 'roles';
        }
      },
      error: (err) => {
        this.creandoRol = false;
        const msg = err?.error?.errors?.nombre
          ? 'Ya existe un rol con ese nombre'
          : 'Error al crear el rol';
        this.mostrarToast(msg, 'danger');
      },
    });
  }

  private resetNuevoRol() {
    this.nuevoRol = { nombre: '', descripcion: '' };
    this.nuevoRolPermisos = new Set();
    this.modulosNuevoRol = this.modulosNuevoRol.map(m => ({ ...m, expandido: false }));
  }

  // ── USUARIOS ───────────────────────────────────────────────────────────────

  cargarUsuarios() {
    this.usuarioSvc.list().subscribe({
      next: res => this.usuarios = res.usuarios ?? [],
      error: () => {},
    });
  }

  seleccionarUsuario(event: any) {
    const id = Number(event.target.value);
    if (!id) { this.modulosUsuario = []; return; }
    this.usuarioSeleccionado = id;
    this.cargandoUsuario = true;
    this.permisoSvc.getPermisosUsuario(id).subscribe({
      next: res => {
        this.modulosUsuario  = res.modulos.map((m: any) => ({ ...m, expandido: false }));
        this.cargandoUsuario = false;
      },
      error: () => this.cargandoUsuario = false,
    });
  }

  setTipoUsuario(permiso: any, tipo: string) {
    permiso.tipo   = tipo === 'NINGUNO' ? null : tipo;
    permiso.activo = tipo === 'GRANT' ? true : tipo === 'DENY' ? false : permiso.en_rol;
  }

  guardarUsuario() {
    if (!this.usuarioSeleccionado) return;
    this.guardandoUsuario = true;
    const personalizaciones = this.modulosUsuario
      .reduce((acc: any[], m: any) => acc.concat(m.permisos), [])
      .map((p: any) => ({ id: p.id, tipo: p.tipo ?? 'NINGUNO' }));

    this.permisoSvc.actualizarUsuario(this.usuarioSeleccionado, personalizaciones).subscribe({
      next: () => {
        this.guardandoUsuario = false;
        this.mostrarToast('Permisos del usuario guardados', 'success');
      },
      error: () => {
        this.guardandoUsuario = false;
        this.mostrarToast('Error al guardar', 'danger');
      },
    });
  }

  // ── SINCRONIZAR ────────────────────────────────────────────────────────────

  async confirmarSincronizar() {
    const a = await this.alert.create({
      header:  'Sincronizar permisos',
      message: '¿Deseas sincronizar los permisos con las rutas actuales de la API?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sincronizar', handler: () => this.sincronizar() },
      ],
    });
    await a.present();
  }

  sincronizar() {
    this.sincronizando = true;
    this.permisoSvc.sincronizar().subscribe({
      next: () => {
        this.sincronizando = false;
        this.mostrarToast('Sincronización completada', 'success');
        this.cargarRoles();
      },
      error: () => {
        this.sincronizando = false;
        this.mostrarToast('Error al sincronizar', 'danger');
      },
    });
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  private async mostrarToast(msg: string, color: string) {
    const t = await this.toast.create({
      message: msg, duration: 2500, color, position: 'bottom',
    });
    t.present();
  }
}