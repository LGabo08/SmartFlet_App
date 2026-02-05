import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  AlertController
} from '@ionic/angular/standalone';

import { UsuarioService } from 'src/app/services/usuario.service';
import type { Usuario } from 'src/models/usuario.model';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class UsuariosPage implements OnInit {
  loading = false;

  usuarios: Usuario[] = [];
  filtered: Usuario[] = [];

  q = '';
  roleFilter = '';
  estadoFilter = '';

  constructor(
    private usuarioService: UsuarioService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.reload();
  }

  async reload() {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.usuarioService.list());
      this.usuarios = res?.usuarios ?? [];
      this.applyFilter();
    } catch (err: any) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: err?.error?.message ?? 'No se pudo cargar el listado de usuarios.',
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    const q = (this.q || '').toLowerCase().trim();
    const role = this.roleFilter;
    const estado = (this.estadoFilter || '').toLowerCase().trim();

    this.filtered = (this.usuarios || []).filter(u => {
      const full = `${u.nombre ?? ''} ${u.apellidos ?? ''}`.toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const est = (u.estado ?? 'activo').toLowerCase();

      const matchQ = !q || full.includes(q) || email.includes(q) || est.includes(q);
      const matchRole = !role || String(u.role_id) === role;
      const matchEstado = !estado || est === estado;

      return matchQ && matchRole && matchEstado;
    });
  }

  // ✅ NUEVO: navegar a editar
  editUser(u: Usuario) {
    this.router.navigate(['/usuarios', u.idUsuario, 'editar']);
  }

  async confirmDelete(u: Usuario) {
    const alert = await this.alertController.create({
      header: 'Eliminar usuario',
      message: `¿Seguro que deseas eliminar a <b>${u.nombre} ${u.apellidos}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteUser(u.idUsuario),
        },
      ],
    });

    await alert.present();
  }

  async deleteUser(idUsuario: number) {
    try {
      await firstValueFrom(this.usuarioService.remove(idUsuario));
      this.usuarios = this.usuarios.filter(x => x.idUsuario !== idUsuario);
      this.applyFilter();
    } catch (err: any) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: err?.error?.message ?? 'No se pudo eliminar el usuario.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }
}
